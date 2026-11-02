import axios, { AxiosError, AxiosInstance } from 'axios';

/*
 * Somfy OAuth implementation.
 *
 * Adapted from the Python OAuth implementation in:
 * https://github.com/iMicknl/python-overkiz-api
 *
 * Original copyright: Copyright (c) 2020 Mick Vleeshouwer
 *
 * Original license: MIT
 *
 * Translated and adapted for @Nils-GitHub1/node-red-contrib-tahoma.
 */

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SOMFY_API = 'https://accounts.somfy.com';

const SOMFY_GINAITE_TOKEN_URL =
  'https://ginaite-prod.ovkube.net/realms/somfy-tahoma/protocol/openid-connect/token';

const SOMFY_GINAITE_SUBJECT_ISSUER = 'somfy-customer';

const SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT =
  'urn:ietf:params:oauth:grant-type:token-exchange';

const SOMFY_GINAITE_SUBJECT_TOKEN_TYPE =
  'urn:ietf:params:oauth:token-type:access_token';

const SOMFY_BOB_SITE_API =
  'https://backoffice-service.ovkube.net/site-api/public/v1';

const SOMFY_CLIENT_ID = process.env.SOMFY_CLIENT_ID || '';
const SOMFY_CLIENT_SECRET = process.env.SOMFY_CLIENT_SECRET || '';
const SOMFY_BOB_API_KEY = process.env.SOMFY_BOB_API_KEY || '';

const SOMFY_BOB_PAGE_SIZE = 20;
const SOMFY_BOB_MAX_SITES = 200;

const TOKEN_EXPIRY_MARGIN_MS = 30_000;
const FALLBACK_TOKEN_LIFETIME_MS = 5 * 60 * 1000;

const DEFAULT_REGION = 'EMEA';

/* -------------------------------------------------------------------------- */
/* Regional endpoints                                                         */
/* -------------------------------------------------------------------------- */

const REGION_ENDPOINTS: Record<string, string> = {
  EMEA: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI/',
  APAC: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI/',
  SNABA: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI/',
};

/* -------------------------------------------------------------------------- */
/* Country mapping                                                            */
/* -------------------------------------------------------------------------- */

const COUNTRY_REGIONS: Record<string, string> = {};

const addCountries = (region: string, countries: string): void => {
  for (const country of countries.split(/\s+/)) {
    if (country) {
      COUNTRY_REGIONS[country] = region;
    }
  }
};

addCountries('SNABA', 'CA US MX');

addCountries('APAC', 'AU HK IN ID JP MY NZ PH SG TW TH VN KR CN');

addCountries(
  'EMEA',
  `
  AL AD AT BY BE BG HR CY CZ DK EG EE FO FI FR GF PF DE GR GP HU
  IL IT JE JO KZ KW LV LB LT LU MQ YT MC MA NL NO NC PS PL PT QA
  IE RE RO RU BL SA RS SK ZA ES SE CH TN TR UA AE GB AM AO AZ BA
  BH CI CM DZ ET GE GG GH GI IM IQ IS KE KG LI LY MD ME MG MK MT
  MU NA NG OM SI SM SN TZ UG UZ VA ZM ZW
  `,
);

/* -------------------------------------------------------------------------- */
/* Public interfaces                                                          */
/* -------------------------------------------------------------------------- */

export interface ISomfyAuthOptions {
  username?: string;
  password?: string;
  refreshToken?: string;
  siteOid?: string;
  gatewayId?: string;
  region?: string;
}

export interface ISomfyGatewayCandidate {
  gatewayId: string;
  homeId: string;
  label: string;
  externalId?: string;
  country?: string;
  region: string;
  roles: string[];
}

export interface ISomfyTokenState {
  refreshToken: string;
  siteOid: string;
  gatewayId: string;
  region: string;
}

/* -------------------------------------------------------------------------- */
/* Internal interfaces                                                        */
/* -------------------------------------------------------------------------- */

interface ISomfyTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  message?: string;
  error?: string;
  error_description?: string;
}

interface ISomfyBobGateway {
  gatewayId?: string;
}

interface ISomfyBobRole {
  roleOID?: string;
}

interface ISomfyBobSubSite {
  externalId?: string;
  gateways?: ISomfyBobGateway[];
}

interface ISomfyBobSite {
  siteOID?: string;
  name?: string;
  country?: string;
  roles?: ISomfyBobRole[];
  currentUserRoles?: ISomfyBobRole[];
  subSites?: ISomfyBobSubSite[];
}

interface ISomfyBobResponse {
  results?: ISomfyBobSite[];
  totalCount?: number;
}

interface ISomfyHttpErrorResponse {
  error?: string;
  error_description?: string;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

export class SomfyAuthError extends Error {
  public readonly status?: number;
  public readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);

    this.name = 'SomfyAuthError';
    this.status = status;
    this.code = code;

    Object.setPrototypeOf(this, SomfyAuthError.prototype);
  }
}

export class SomfyBadCredentialsError extends SomfyAuthError {
  constructor(message: string) {
    super(message);

    this.name = 'SomfyBadCredentialsError';

    Object.setPrototypeOf(this, SomfyBadCredentialsError.prototype);
  }
}

export class SomfyNoGatewaySelectedError extends SomfyAuthError {
  constructor(message: string) {
    super(message);

    this.name = 'SomfyNoGatewaySelectedError';

    Object.setPrototypeOf(this, SomfyNoGatewaySelectedError.prototype);
  }
}

/* -------------------------------------------------------------------------- */
/* Main authentication class                                                  */
/* -------------------------------------------------------------------------- */

export class SomfyCloudNewAuth {
  private readonly username?: string;
  private readonly password?: string;

  private readonly axiosInstance: AxiosInstance;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private expiresAt = 0;

  private tokenSiteOid: string | null = null;

  private gateways: ISomfyGatewayCandidate[] = [];

  private selectedSiteOid: string | null = null;
  private selectedGatewayId: string | null = null;
  private selectedRegion: string | null = null;
  private selectedEndpoint: string | null = null;

  private refreshPromise: Promise<void> | null = null;
  private loginPromise: Promise<void> | null = null;

  private tokenRefreshCallback?: (session: ISomfyTokenState) => Promise<void>;

  /**
   * Tracks the complete persisted session, not just the refresh token.
   *
   * This ensures that changes to the selected installation are also
   * persisted when the next site-scoped refresh takes place.
   */
  private persistedSessionKey: string | null = null;

  private loggedIn = false;
  private closed = false;

  constructor(options: ISomfyAuthOptions) {
    this.username = options.username;
    this.password = options.password;

    this.refreshToken = options.refreshToken || null;

    this.persistedSessionKey =
      options.refreshToken &&
      options.siteOid &&
      options.gatewayId &&
      options.region
        ? this.sessionKey({
            refreshToken: options.refreshToken,
            siteOid: options.siteOid,
            gatewayId: options.gatewayId,
            region: options.region,
          })
        : null;

    this.selectedSiteOid = options.siteOid || null;
    this.selectedGatewayId = options.gatewayId || null;
    this.selectedRegion = options.region || null;

    if (this.selectedRegion) {
      const endpoint = REGION_ENDPOINTS[this.selectedRegion];

      if (!endpoint) {
        throw new SomfyAuthError(
          `Unknown Somfy region: ${this.selectedRegion}`,
        );
      }

      this.selectedEndpoint = endpoint;
    }

    this.axiosInstance = axios.create({
      timeout: 20000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Configuration validation                                              */
  /* ---------------------------------------------------------------------- */

  private validateConfiguration(): void {
    if (!SOMFY_CLIENT_ID || !SOMFY_CLIENT_SECRET || !SOMFY_BOB_API_KEY) {
      throw new SomfyAuthError(
        'Somfy OAuth configuration is incomplete. Configure ' +
          'SOMFY_CLIENT_ID, SOMFY_CLIENT_SECRET and SOMFY_BOB_API_KEY.',
        undefined,
        'CONFIGURATION_ERROR',
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Authentication                                                         */
  /* ---------------------------------------------------------------------- */

  /**
   * Authenticate using either:
   *
   * 1. A restored refresh-token session.
   * 2. A fresh Somfy username/password login.
   *
   * Concurrent login calls share one Promise.
   */
  public async login(): Promise<void> {
    if (this.closed) {
      throw new SomfyAuthError('Somfy authentication instance is closed');
    }

    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = (async () => {
      try {
        this.validateConfiguration();

        /*
         * Restore an existing complete session.
         */
        if (
          this.refreshToken &&
          this.selectedSiteOid &&
          this.selectedGatewayId &&
          this.selectedRegion
        ) {
          this.loggedIn = true;
          this.expiresAt = 0;

          return;
        }

        /*
         * Fresh password authentication.
         */
        if (!this.username || !this.password) {
          throw new SomfyBadCredentialsError(
            'Somfy username and password are required for a fresh login',
          );
        }

        await this.performPasswordGrant();

        if (!this.accessToken) {
          throw new SomfyAuthError(
            'Somfy password grant did not return an access token',
          );
        }

        /*
         * Exchange the Somfy Accounts token for a Ginaite token.
         */
        await this.performGinaiteTokenExchange(this.accessToken);

        if (!this.accessToken) {
          throw new SomfyAuthError(
            'Ginaite token exchange did not return an access token',
          );
        }

        this.loggedIn = true;

        /*
         * Discover all installations.
         */
        await this.discoverGateways();

        /*
         * Automatically select the only available installation.
         */
        if (!this.selectedGatewayId && this.gateways.length === 1) {
          this.selectGateway(this.gateways[0].gatewayId);
        } else if (this.selectedGatewayId) {
          const existingGateway = this.gateways.find(
            (gateway) => gateway.gatewayId === this.selectedGatewayId,
          );

          if (existingGateway) {
            this.selectGateway(existingGateway.gatewayId);
          } else {
            this.selectedGatewayId = null;
            this.selectedSiteOid = null;
            this.selectedRegion = null;
            this.selectedEndpoint = null;
          }
        }
      } catch (error) {
        this.loggedIn = false;
        throw error;
      } finally {
        this.loginPromise = null;
      }
    })();

    return this.loginPromise;
  }

  /* ---------------------------------------------------------------------- */
  /* Somfy password authentication                                          */
  /* ---------------------------------------------------------------------- */

  private async performPasswordGrant(): Promise<void> {
    const body = new URLSearchParams();

    body.append('grant_type', 'password');
    body.append('client_id', SOMFY_CLIENT_ID);
    body.append('client_secret', SOMFY_CLIENT_SECRET);
    body.append('username', this.username!);
    body.append('password', this.password!);

    let response;

    try {
      response = await this.axiosInstance.post<ISomfyTokenResponse>(
        `${SOMFY_API}/oauth/oauth/v2/token/jwt`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch (error) {
      throw this.mapHttpError(error, 'Somfy password authentication failed');
    }

    const token = response.data;

    if (
      token.message === 'error.invalid.grant' ||
      token.error === 'invalid_grant'
    ) {
      throw new SomfyBadCredentialsError('Invalid Somfy username or password');
    }

    this.updateToken(token);

    if (!this.accessToken) {
      throw new SomfyAuthError('Somfy password grant returned no access token');
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Ginaite token exchange                                                 */
  /* ---------------------------------------------------------------------- */

  private async performGinaiteTokenExchange(
    ssoAccessToken: string,
  ): Promise<void> {
    const body = new URLSearchParams();

    body.append('grant_type', SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT);
    body.append('client_id', SOMFY_CLIENT_ID);
    body.append('client_secret', SOMFY_CLIENT_SECRET);
    body.append('subject_token', ssoAccessToken);
    body.append('subject_issuer', SOMFY_GINAITE_SUBJECT_ISSUER);
    body.append('subject_token_type', SOMFY_GINAITE_SUBJECT_TOKEN_TYPE);

    let response;

    try {
      response = await this.axiosInstance.post<ISomfyTokenResponse>(
        SOMFY_GINAITE_TOKEN_URL,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch (error) {
      throw this.mapHttpError(error, 'Somfy Ginaite token exchange failed');
    }

    this.updateToken(response.data);

    this.tokenSiteOid = null;

    if (!this.accessToken) {
      throw new SomfyAuthError(
        'Ginaite token exchange returned no access token',
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /* BOB gateway discovery                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Discover all Somfy installations associated with the account.
   *
   * BOB requires an account-wide Ginaite token.
   * Results are retrieved using pagination.
   */
  public async discoverGateways(): Promise<ISomfyGatewayCandidate[]> {
    await this.ensureAccountToken();

    const candidates: ISomfyGatewayCandidate[] = [];

    let sitesSeen = 0;
    let totalCount = 0;

    for (
      let offset = 0;
      offset < SOMFY_BOB_MAX_SITES;
      offset += SOMFY_BOB_PAGE_SIZE
    ) {
      const data = await this.bobGet(
        `sites?withGateways=true&limit=${SOMFY_BOB_PAGE_SIZE}&offset=${offset}`,
      );

      const page = data as ISomfyBobResponse;

      const results = Array.isArray(page.results) ? page.results : [];

      totalCount = Number(page.totalCount || 0);

      sitesSeen += results.length;

      for (const site of results) {
        const siteOid = site.siteOID;

        if (!siteOid) {
          continue;
        }

        const region = this.regionForCountry(site.country);

        const subSites = site.subSites || [];

        for (const subSite of subSites) {
          const gateway = subSite.gateways?.[0];

          if (!gateway?.gatewayId) {
            continue;
          }

          const roles = site.currentUserRoles || site.roles || [];

          candidates.push({
            gatewayId: gateway.gatewayId,
            homeId: siteOid,
            label: site.name || siteOid,
            externalId: subSite.externalId,
            country: site.country,
            region,
            roles: roles
              .map((role) => role.roleOID)
              .filter((role): role is string => typeof role === 'string'),
          });
        }
      }

      if (results.length === 0 || sitesSeen >= totalCount) {
        break;
      }
    }

    if (sitesSeen < totalCount) {
      console.warn(
        `[Somfy OAuth] BOB returned ${sitesSeen} of ${totalCount} sites. ` +
          'The maximum discovery limit was reached.',
      );
    }

    this.gateways = candidates;

    return this.availableGateways;
  }

  /* ---------------------------------------------------------------------- */
  /* BOB API requests                                                       */
  /* ---------------------------------------------------------------------- */

  private async bobGet(path: string): Promise<Record<string, unknown>> {
    if (!this.accessToken) {
      throw new SomfyAuthError('No Ginaite access token available for BOB');
    }

    try {
      const response = await this.axiosInstance.get(
        `${SOMFY_BOB_SITE_API}/${path}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'X-Api-Key': SOMFY_BOB_API_KEY,
          },
        },
      );

      return response.data as Record<string, unknown>;
    } catch (error) {
      throw this.mapHttpError(error, 'Somfy BOB site discovery failed');
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Account-wide token                                                     */
  /* ---------------------------------------------------------------------- */

  /**
   * Ensure that an account-wide token is available.
   *
   * This token is used exclusively for BOB discovery.
   */
  private async ensureAccountToken(): Promise<void> {
    if (this.accessToken && !this.isExpired() && this.tokenSiteOid === null) {
      return;
    }

    if (!this.refreshToken) {
      throw new SomfyAuthError(
        'Cannot discover Somfy sites without a refresh token',
      );
    }

    await this.refreshTokenWithLock(null);

    /*
     * Do not accidentally reuse the account-wide token
     * for a subsequent regional API request.
     */
    if (this.selectedSiteOid) {
      this.expiresAt = 0;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Gateway selection                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Select a gateway and its corresponding installation.
   */
  public selectGateway(gatewayId: string): void {
    if (!gatewayId || typeof gatewayId !== 'string') {
      throw new SomfyNoGatewaySelectedError(
        'A valid Somfy gateway ID is required',
      );
    }

    const gateway = this.gateways.find(
      (candidate) => candidate.gatewayId === gatewayId,
    );

    if (!gateway) {
      throw new SomfyAuthError(`Unknown Somfy gateway ID: ${gatewayId}`);
    }

    const endpoint = REGION_ENDPOINTS[gateway.region];

    if (!endpoint) {
      throw new SomfyAuthError(
        `No API endpoint configured for region ${gateway.region}`,
      );
    }

    const selectionChanged =
      this.selectedGatewayId !== gateway.gatewayId ||
      this.selectedSiteOid !== gateway.homeId ||
      this.selectedRegion !== gateway.region;

    this.selectedGatewayId = gateway.gatewayId;
    this.selectedSiteOid = gateway.homeId;
    this.selectedRegion = gateway.region;
    this.selectedEndpoint = endpoint;

    if (selectionChanged) {
      /*
       * Force a site-scoped token refresh.
       *
       * The next successful refresh will also persist
       * the complete newly selected session.
       */
      this.expiresAt = 0;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Regional resolution                                                    */
  /* ---------------------------------------------------------------------- */

  private regionForCountry(country?: string): string {
    const code = country?.toUpperCase();

    const region = code ? COUNTRY_REGIONS[code] : undefined;

    if (!region) {
      console.warn(
        `[Somfy OAuth] Unknown country "${country}". ` +
          `Using ${DEFAULT_REGION}.`,
      );

      return DEFAULT_REGION;
    }

    return region;
  }

  /* ---------------------------------------------------------------------- */
  /* Token expiration                                                       */
  /* ---------------------------------------------------------------------- */

  private isExpired(): boolean {
    if (!this.accessToken || !this.expiresAt) {
      return true;
    }

    return Date.now() + TOKEN_EXPIRY_MARGIN_MS >= this.expiresAt;
  }

  /**
   * Refresh the token when necessary.
   */
  public async refreshIfNeeded(): Promise<boolean> {
    if (!this.isExpired()) {
      /*
       * Also retry persistence if an earlier persistence
       * callback failed after the token was refreshed.
       */
      await this.notifyTokenRefresh();

      return false;
    }

    if (!this.refreshToken) {
      if (this.selectedSiteOid) {
        throw new SomfyAuthError(
          'Cannot generate a site-scoped token without a refresh token',
        );
      }

      return false;
    }

    await this.refreshTokenWithLock(this.selectedSiteOid);

    return true;
  }

  /* ---------------------------------------------------------------------- */
  /* Serialized token refresh                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * Serialize refresh operations.
   *
   * A refresh operation for one scope must finish before
   * another scope can start.
   */
  private async refreshTokenWithLock(siteOid: string | null): Promise<void> {
    while (true) {
      if (this.closed) {
        throw new SomfyAuthError('Somfy authentication instance is closed');
      }

      if (this.refreshPromise) {
        await this.refreshPromise;

        if (!this.isExpired() && this.tokenSiteOid === siteOid) {
          return;
        }

        continue;
      }

      if (!this.isExpired() && this.tokenSiteOid === siteOid) {
        return;
      }

      const refreshOperation = this.performRefresh(siteOid);

      this.refreshPromise = refreshOperation;

      try {
        await refreshOperation;
      } finally {
        /*
         * Only clear the Promise belonging to this operation.
         */
        if (this.refreshPromise === refreshOperation) {
          this.refreshPromise = null;
        }
      }

      return;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Ginaite refresh grant                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Perform a refresh-token grant.
   *
   * siteOid:
   *   null = account-wide token.
   *   value = installation-scoped token.
   */
  private async performRefresh(siteOid: string | null): Promise<void> {
    if (!this.refreshToken) {
      throw new SomfyAuthError('No Somfy refresh token available');
    }

    const previousRefreshToken = this.refreshToken;

    let url = SOMFY_GINAITE_TOKEN_URL;

    if (siteOid) {
      url += `?siteOID=${encodeURIComponent(siteOid)}`;
    }

    const body = new URLSearchParams();

    body.append('grant_type', 'refresh_token');
    body.append('client_id', SOMFY_CLIENT_ID);
    body.append('client_secret', SOMFY_CLIENT_SECRET);
    body.append('refresh_token', previousRefreshToken);

    let response;

    try {
      response = await this.axiosInstance.post<ISomfyTokenResponse>(
        url,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch (error) {
      const axiosError = error as AxiosError<ISomfyHttpErrorResponse>;

      if (axiosError.response?.data?.error === 'invalid_grant') {
        throw new SomfyBadCredentialsError(
          axiosError.response.data.error_description ||
            'Somfy refresh token has been revoked',
        );
      }

      throw this.mapHttpError(error, 'Somfy token refresh failed');
    }

    const token = response.data;

    /*
     * Reject incomplete responses.
     *
     * Never retain an old access token as if the refresh
     * operation had succeeded.
     */
    if (!token.access_token) {
      throw new SomfyAuthError('Somfy token refresh returned no access token');
    }

    /*
     * Preserve the previous refresh token when Ginaite
     * does not return a replacement.
     */
    if (!token.refresh_token) {
      token.refresh_token = previousRefreshToken;
    }

    /*
     * Update the tokens and scope.
     */
    this.updateToken(token);

    this.tokenSiteOid = siteOid;

    /*
     * Persist the complete session before reporting
     * a successful site-scoped refresh.
     *
     * If persistence fails, the operation rejects.
     * The valid in-memory token is retained, and the next
     * request retries persistence before using that token.
     */
    await this.notifyTokenRefresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Session persistence                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Build a stable comparison key for a complete session.
   */
  private sessionKey(session: ISomfyTokenState): string {
    return JSON.stringify([
      session.refreshToken,
      session.siteOid,
      session.gatewayId,
      session.region,
    ]);
  }

  /**
   * Persist the complete OAuth session.
   *
   * Changes to either the refresh token or the selected
   * installation cause persistence.
   */
  private async notifyTokenRefresh(): Promise<void> {
    if (!this.refreshToken) {
      return;
    }

    /*
     * An account-wide token can exist before selection.
     * It cannot yet be exported as an installation session.
     */
    if (
      !this.selectedSiteOid ||
      !this.selectedGatewayId ||
      !this.selectedRegion
    ) {
      return;
    }

    const session = this.getSession();

    const currentKey = this.sessionKey(session);

    if (currentKey === this.persistedSessionKey) {
      return;
    }

    if (!this.tokenRefreshCallback) {
      throw new SomfyAuthError(
        'The OAuth session changed but no Node-RED persistence callback is configured.',
        undefined,
        'SESSION_PERSISTENCE_UNAVAILABLE',
      );
    }

    try {
      await this.tokenRefreshCallback(session);

      /*
       * Only mark the session persisted after successful
       * completion of the Node-RED callback.
       */
      this.persistedSessionKey = currentKey;
    } catch {
      throw new SomfyAuthError(
        'Somfy authentication was refreshed, but the updated session could not be persisted. ' +
          'Check Node-RED credential storage before retrying.',
        undefined,
        'SESSION_PERSISTENCE_FAILED',
      );
    }
  }

  /**
   * Register the Node-RED session persistence callback.
   */
  public setTokenRefreshCallback(
    callback: (session: ISomfyTokenState) => Promise<void>,
  ): void {
    this.tokenRefreshCallback = callback;
  }

  /**
   * Return the complete selected installation session.
   */
  public getSession(): ISomfyTokenState {
    if (
      !this.refreshToken ||
      !this.selectedSiteOid ||
      !this.selectedGatewayId ||
      !this.selectedRegion
    ) {
      throw new SomfyAuthError(
        'Cannot export an incomplete Somfy OAuth session',
      );
    }

    return {
      refreshToken: this.refreshToken,
      siteOid: this.selectedSiteOid,
      gatewayId: this.selectedGatewayId,
      region: this.selectedRegion,
    };
  }

  /**
   * Export credentials for Node-RED.
   *
   * The access token is deliberately never persisted.
   */
  public toCredentials(): ISomfyTokenState {
    const session = this.getSession();

    this.persistedSessionKey = this.sessionKey(session);

    return session;
  }

  /* ---------------------------------------------------------------------- */
  /* Authentication headers                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Return authorization headers for the selected installation.
   *
   * A valid site-scoped access token is obtained automatically.
   */
  public async getHeaders(): Promise<Record<string, string>> {
    await this.ensureSiteToken();

    if (!this.accessToken) {
      throw new SomfyAuthError('No Somfy access token available');
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Ensure a valid token scoped to the selected installation.
   */
  private async ensureSiteToken(): Promise<void> {
    if (this.closed) {
      throw new SomfyAuthError('Somfy authentication instance is closed');
    }

    if (!this.selectedSiteOid || !this.selectedGatewayId) {
      throw new SomfyNoGatewaySelectedError(
        'No Somfy gateway has been selected',
      );
    }

    if (!this.selectedRegion || !this.selectedEndpoint) {
      throw new SomfyAuthError('No regional Somfy API endpoint is configured');
    }

    /*
     * Reuse the existing token only when it belongs
     * to the currently selected installation.
     */
    if (!this.isExpired() && this.tokenSiteOid === this.selectedSiteOid) {
      /*
       * Important:
       * A previous persistence failure must not result
       * in an unpersisted token being silently accepted.
       */
      await this.notifyTokenRefresh();

      return;
    }

    if (!this.refreshToken) {
      throw new SomfyAuthError('No Somfy refresh token available');
    }

    await this.refreshTokenWithLock(this.selectedSiteOid);

    if (
      !this.accessToken ||
      this.isExpired() ||
      this.tokenSiteOid !== this.selectedSiteOid
    ) {
      throw new SomfyAuthError(
        'Unable to obtain a valid Somfy site-scoped access token',
      );
    }

    /*
     * Ensure persistence has completed before returning.
     */
    await this.notifyTokenRefresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Public properties                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Return the selected regional API endpoint.
   */
  public get endpoint(): string {
    if (!this.selectedEndpoint) {
      throw new SomfyNoGatewaySelectedError(
        'No Somfy gateway has been selected',
      );
    }

    return this.selectedEndpoint;
  }

  /**
   * Return the selected site OID.
   */
  public get siteOid(): string | null {
    return this.selectedSiteOid;
  }

  /**
   * Return the selected gateway ID.
   */
  public get gatewayId(): string | null {
    return this.selectedGatewayId;
  }

  /**
   * Return the selected region.
   */
  public get region(): string | null {
    return this.selectedRegion;
  }

  /**
   * Return available gateways.
   *
   * Return copies to prevent external modification.
   */
  public get availableGateways(): ISomfyGatewayCandidate[] {
    return this.gateways.map((gateway) => ({
      ...gateway,
      roles: [...gateway.roles],
    }));
  }

  /**
   * Return whether authentication has been initialized.
   */
  public isAuthenticated(): boolean {
    return this.loggedIn && !this.closed;
  }

  /**
   * Compatibility method used by SomfyCloudApi.
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    return this.getHeaders();
  }

  /**
   * Return whether a gateway has been selected.
   */
  public get hasSelectedGateway(): boolean {
    return Boolean(
      this.selectedGatewayId && this.selectedSiteOid && this.selectedEndpoint,
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Token management                                                       */
  /* ---------------------------------------------------------------------- */

  /**
   * Update the current access and refresh tokens.
   */
  private updateToken(token: ISomfyTokenResponse): void {
    if (!token.access_token) {
      throw new SomfyAuthError(
        'Somfy authentication response contains no access token',
      );
    }

    this.accessToken = token.access_token;

    /*
     * Ginaite may rotate refresh tokens.
     *
     * Never overwrite a valid existing refresh token
     * with an undefined response value.
     */
    if (token.refresh_token) {
      this.refreshToken = token.refresh_token;
    }

    const expiresIn =
      typeof token.expires_in === 'number' &&
      Number.isFinite(token.expires_in) &&
      token.expires_in > 0
        ? token.expires_in
        : FALLBACK_TOKEN_LIFETIME_MS / 1000;

    this.expiresAt = Date.now() + expiresIn * 1000;
  }

  /* ---------------------------------------------------------------------- */
  /* Session restoration                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Restore a previously persisted session.
   *
   * The access token is deliberately not restored.
   * A fresh site-scoped token is obtained on demand.
   */
  public restoreSession(session: ISomfyTokenState): void {
    if (this.closed) {
      throw new SomfyAuthError(
        'Cannot restore a closed Somfy authentication instance',
      );
    }

    if (
      !session ||
      typeof session.refreshToken !== 'string' ||
      !session.refreshToken ||
      typeof session.siteOid !== 'string' ||
      !session.siteOid ||
      typeof session.gatewayId !== 'string' ||
      !session.gatewayId ||
      typeof session.region !== 'string' ||
      !session.region
    ) {
      throw new SomfyAuthError('Invalid Somfy OAuth session');
    }

    const endpoint = REGION_ENDPOINTS[session.region];

    if (!endpoint) {
      throw new SomfyAuthError(`Unknown Somfy region: ${session.region}`);
    }

    this.refreshToken = session.refreshToken;

    this.selectedSiteOid = session.siteOid;
    this.selectedGatewayId = session.gatewayId;
    this.selectedRegion = session.region;
    this.selectedEndpoint = endpoint;

    /*
     * The restored credentials are already persisted.
     */
    this.persistedSessionKey = this.sessionKey(session);

    /*
     * Clear all access-token state.
     */
    this.accessToken = null;
    this.expiresAt = 0;
    this.tokenSiteOid = null;

    this.loggedIn = true;
  }

  /* ---------------------------------------------------------------------- */
  /* Logout                                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Clear the local authentication session.
   *
   * This deliberately does not revoke the remote refresh token.
   *
   * The method remains synchronous for compatibility
   * with existing SomfyCloudApi logout handling.
   */
  public logout(): void {
    this.closed = true;

    this.loggedIn = false;

    this.accessToken = null;
    this.refreshToken = null;

    this.expiresAt = 0;

    this.tokenSiteOid = null;

    this.gateways = [];

    this.selectedSiteOid = null;
    this.selectedGatewayId = null;
    this.selectedRegion = null;
    this.selectedEndpoint = null;

    this.persistedSessionKey = null;

    this.tokenRefreshCallback = undefined;
  }

  /* ---------------------------------------------------------------------- */
  /* HTTP error handling                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Convert Axios errors into safe Somfy authentication errors.
   *
   * Never include:
   * - Request headers
   * - Passwords
   * - Access tokens
   * - Refresh tokens
   * - Request bodies
   */
  private mapHttpError(
    error: unknown,
    fallbackMessage: string,
  ): SomfyAuthError {
    if (error instanceof SomfyAuthError) {
      return error;
    }

    if (!axios.isAxiosError(error)) {
      return new SomfyAuthError(fallbackMessage);
    }

    const axiosError = error as AxiosError<ISomfyHttpErrorResponse>;

    const status = axiosError.response?.status;

    const responseData = axiosError.response?.data;

    const errorCode = responseData?.error;

    /*
     * Invalid credentials or revoked refresh token.
     */
    if (
      errorCode === 'invalid_grant' ||
      errorCode === 'invalid_credentials' ||
      status === 401
    ) {
      return new SomfyBadCredentialsError(
        'Somfy authentication failed. Check the credentials or refresh token.',
      );
    }

    /*
     * Insufficient permissions.
     */
    if (status === 403) {
      return new SomfyAuthError(
        'Somfy authentication request was forbidden',
        status,
        'FORBIDDEN',
      );
    }

    /*
     * Rate limiting.
     */
    if (status === 429) {
      return new SomfyAuthError(
        'Somfy authentication service rate limit exceeded',
        status,
        'RATE_LIMITED',
      );
    }

    /*
     * Server-side errors.
     */
    if (status && status >= 500) {
      return new SomfyAuthError(
        'Somfy authentication service is temporarily unavailable',
        status,
        'SERVER_ERROR',
      );
    }

    /*
     * Network timeout.
     */
    if (axiosError.code === 'ECONNABORTED') {
      return new SomfyAuthError(
        'Somfy authentication request timed out',
        undefined,
        'TIMEOUT',
      );
    }

    /*
     * Network connection failures.
     */
    if (
      axiosError.code === 'ECONNREFUSED' ||
      axiosError.code === 'ENOTFOUND' ||
      axiosError.code === 'ECONNRESET'
    ) {
      return new SomfyAuthError(
        'Unable to connect to the Somfy authentication service',
        undefined,
        axiosError.code,
      );
    }

    /*
     * Generic HTTP failure.
     */
    return new SomfyAuthError(
      fallbackMessage,
      status,
      errorCode || axiosError.code,
    );
  }
}
