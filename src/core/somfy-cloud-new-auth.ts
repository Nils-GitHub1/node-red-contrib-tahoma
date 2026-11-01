
import axios, { AxiosError, AxiosInstance } from 'axios';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SOMFY_API = 'https://accounts.somfy.com';

const SOMFY_CLIENT_ID =
  '0d8e920c-1478-11e7-a377-02dd59bd3041_1ewvaqmclfogo4kcsoo0c8k4kso884owg08sg8c40sk4go4ksg';
const SOMFY_CLIENT_SECRET =
  '12k73w1n540g8o4cokg0cw84cog840k84cwggscwg884004kgk';

const SOMFY_GINAITE_TOKEN_URL =
  'https://ginaite-prod.ovkube.net/realms/somfy-tahoma/protocol/openid-connect/token';

const SOMFY_GINAITE_SUBJECT_ISSUER = 'somfy-customer';

const SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT =
  'urn:ietf:params:oauth:grant-type:token-exchange';

const SOMFY_GINAITE_SUBJECT_TOKEN_TYPE =
  'urn:ietf:params:oauth:token-type:access_token';
const SOMFY_BOB_SITE_API =
  'https://backoffice-service.ovkube.net/site-api/public/v1';

const SOMFY_BOB_API_KEY = '184638B3FBE874ACD24C14FBD657B';

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

const COUNTRY_REGIONS: Record<string, string> = {
  // North America
  CA: 'SNABA',
  US: 'SNABA',
  MX: 'SNABA',
  // Asia Pacific
  AU: 'APAC',
  HK: 'APAC',
  IN: 'APAC',
  ID: 'APAC',
  JP: 'APAC',
  MY: 'APAC',
  NZ: 'APAC',
  PH: 'APAC',
  SG: 'APAC',
  TW: 'APAC',
  TH: 'APAC',
  VN: 'APAC',
  KR: 'APAC',
  CN: 'APAC',
  // Europe, Middle East and Africa
  AL: 'EMEA',
  AD: 'EMEA',
  AT: 'EMEA',
  BY: 'EMEA',
  BE: 'EMEA',
  BG: 'EMEA',
  HR: 'EMEA',
  CY: 'EMEA',
  CZ: 'EMEA',
  DK: 'EMEA',
  EG: 'EMEA',
  EE: 'EMEA',
  FO: 'EMEA',
  FI: 'EMEA',
  FR: 'EMEA',
  GF: 'EMEA',
  PF: 'EMEA',
  DE: 'EMEA',
  GR: 'EMEA',
  GP: 'EMEA',
  HU: 'EMEA',
  IL: 'EMEA',
  IT: 'EMEA',
  JE: 'EMEA',
  JO: 'EMEA',
  KZ: 'EMEA',
  KW: 'EMEA',
  LV: 'EMEA',
  LB: 'EMEA',
  LT: 'EMEA',
  LU: 'EMEA',
  MQ: 'EMEA',
  YT: 'EMEA',
  MC: 'EMEA',
  MA: 'EMEA',
  NL: 'EMEA',
  NO: 'EMEA',
  NC: 'EMEA',
  PS: 'EMEA',
  PL: 'EMEA',
  PT: 'EMEA',
  QA: 'EMEA',
  IE: 'EMEA',
  RE: 'EMEA',
  RO: 'EMEA',
  RU: 'EMEA',
  BL: 'EMEA',
  SA: 'EMEA',
  RS: 'EMEA',
  SK: 'EMEA',
  ZA: 'EMEA',
  ES: 'EMEA',
  SE: 'EMEA',
  CH: 'EMEA',
  TN: 'EMEA',
  TR: 'EMEA',
  UA: 'EMEA',
  AE: 'EMEA',
  GB: 'EMEA',
  // Additional EMEA countries
  AM: 'EMEA',
  AO: 'EMEA',
  AZ: 'EMEA',
  BA: 'EMEA',
  BH: 'EMEA',
  CI: 'EMEA',
  CM: 'EMEA',
  DZ: 'EMEA',
  ET: 'EMEA',
  GE: 'EMEA',
  GG: 'EMEA',
  GH: 'EMEA',
  GI: 'EMEA',
  IM: 'EMEA',
  IQ: 'EMEA',
  IS: 'EMEA',
  KE: 'EMEA',
  KG: 'EMEA',
  LI: 'EMEA',
  LY: 'EMEA',
  MD: 'EMEA',
  ME: 'EMEA',
  MG: 'EMEA',
  MK: 'EMEA',
  MT: 'EMEA',
  MU: 'EMEA',
  NA: 'EMEA',
  NG: 'EMEA',
  OM: 'EMEA',
  SI: 'EMEA',
  SM: 'EMEA',
  SN: 'EMEA',
  TZ: 'EMEA',
  UG: 'EMEA',
  UZ: 'EMEA',
  VA: 'EMEA',
  ZM: 'EMEA',
  ZW: 'EMEA',
};
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

  private persistedRefreshToken: string | null = null;

  private warnedMissingCallback = false;

  private loggedIn = false;

  private closed = false;
  /**
   * Create a new Somfy OAuth authentication instance.
   *
   * Fresh login:
   *   username + password
   *
   * Restored session:
   *   refreshToken + siteOid + gatewayId + region
   */
  constructor(options: ISomfyAuthOptions) {
    this.username = options.username;

    this.password = options.password;

    this.refreshToken = options.refreshToken || null;

    this.persistedRefreshToken = options.refreshToken || null;

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
  /* Authentication                                                         */
  /* ---------------------------------------------------------------------- */
  /**
   * Authenticate using either a fresh login or a stored session.
   *
   * Concurrent login requests share the same Promise.
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
        /*
         * Restore an existing OAuth session.
         *
         * The stored refresh token will be exchanged
         * for a fresh site-scoped token when needed.
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
         * Exchange the Somfy Accounts token
         * for a Ginaite account-wide token.
         */
        await this.performGinaiteTokenExchange(this.accessToken);

        if (!this.accessToken) {
          throw new SomfyAuthError(
            'Ginaite token exchange did not return an access token',
          );
        }

        this.loggedIn = true;
        /*
         * Discover all installations associated
         * with the Somfy account.
         */
        await this.discoverGateways();
        /*
         * Automatically select the only available
         * installation.
         */
        if (!this.selectedGatewayId && this.gateways.length === 1) {
          this.selectGateway(this.gateways[0].gatewayId);
        } else if (this.selectedGatewayId) {
          /*
           * Restore a previously selected installation
           * when its gateway is still available.
           */
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

  /**
   * Somfy Accounts password grant.
   *
   * This is the first authentication step.
   */
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
  /* Ginaite / Keycloak token exchange                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Exchange the Somfy Accounts access token for a Ginaite token.
   */
  private async performGinaiteTokenExchange(
    ssoAccessToken: string,
  ): Promise<void> {
    const body = new URLSearchParams();

    body.append('grant_type', SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT);
    body.append('client_id', SOMFY_CLIENT_ID);
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
      throw this.mapHttpError(
        error,
        'Somfy Ginaite token exchange failed',
      );
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
   * Discover all Somfy sites and installations.
   *
   * BOB uses an account-wide Ginaite token.
   * The listing is paginated.
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
      const results = Array.isArray(page.results)
        ? page.results
        : [];

      totalCount = Number(page.totalCount || 0);
      sitesSeen += results.length;

      for (const site of results) {
        const siteOid = site.siteOID;

        if (!siteOid) {
          continue;
        }

        const region = this.regionForCountry(site.country);
        const subSites = site.subSites || [];

        /*
         * Each sub-site represents an OverKiz setup.
         */
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
              .filter(
                (role): role is string =>
                  typeof role === 'string',
              ),
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

  /**
   * Make an authenticated BOB API request.
   */
  private async bobGet(
    path: string,
  ): Promise<Record<string, unknown>> {
    if (!this.accessToken) {
      throw new SomfyAuthError(
        'No Ginaite access token available for BOB',
      );
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
      throw this.mapHttpError(
        error,
        'Somfy BOB site discovery failed',
      );
    }
  }

  /**
   * Ensure that an account-wide token is available.
   *
   * BOB discovery requires an account-wide token.
   */
  private async ensureAccountToken(): Promise<void> {
    if (
      this.accessToken &&
      !this.isExpired() &&
      this.tokenSiteOid === null
    ) {
      return;
    }

    if (!this.refreshToken) {
      throw new SomfyAuthError(
        'Cannot discover Somfy sites without a refresh token',
      );
    }

    await this.refreshTokenWithLock(null);

    /*
     * The next regional API request must restore
     * the selected site's token scope.
     */
    if (this.selectedSiteOid) {
      this.expiresAt = 0;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Gateway selection                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Select a gateway and its corresponding Somfy installation.
   *
   * Determines:
   * - Site OID
   * - Gateway ID
   * - Regional API endpoint
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
      throw new SomfyAuthError(
        `Unknown Somfy gateway ID: ${gatewayId}`,
      );
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

    /*
     * Force generation of a site-scoped token
     * when the installation changes.
     */
    if (selectionChanged) {
      this.expiresAt = 0;
    }
  }

  /**
   * Resolve the regional API endpoint from a country code.
   */
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
  /* Token refresh                                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * Check whether the access token has expired.
   *
   * A safety margin avoids using a token immediately
   * before its actual expiration.
   */
  private isExpired(): boolean {
    if (!this.accessToken || !this.expiresAt) {
      return true;
    }

    return Date.now() + TOKEN_EXPIRY_MARGIN_MS >= this.expiresAt;
  }

  /**
   * Refresh the token if necessary.
   *
   * Concurrent callers share the same refresh operation.
   */
  public async refreshIfNeeded(): Promise<boolean> {
    if (!this.isExpired()) {
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

  /**
   * Serialize refresh operations.
   *
   * Ginaite may rotate refresh tokens.
   *
   * A request for a different token scope must wait for
   * the current refresh operation before starting another.
   */
  private async refreshTokenWithLock(
    siteOid: string | null,
  ): Promise<void> {
    while (true) {
      if (this.closed) {
        throw new SomfyAuthError(
          'Somfy authentication instance is closed',
        );
      }

      /*
       * Another request is currently refreshing the token.
       */
      if (this.refreshPromise) {
        await this.refreshPromise;

        /*
         * The other operation may already have produced
         * the correct token.
         */
        if (
          !this.isExpired() &&
          this.tokenSiteOid === siteOid
        ) {
          return;
        }

        /*
         * Otherwise continue and generate the required scope.
         */
        continue;
      }

      /*
       * Recheck after obtaining the refresh opportunity.
       */
      if (
        !this.isExpired() &&
        this.tokenSiteOid === siteOid
      ) {
        return;
      }

      const refreshOperation = this.performRefresh(siteOid);

      this.refreshPromise = refreshOperation;

      try {
        await refreshOperation;
      } finally {
        /*
         * Do not clear another operation's Promise.
         */
        if (this.refreshPromise === refreshOperation) {
          this.refreshPromise = null;
        }
      }

      return;
    }
  }

  /**
   * Perform the Ginaite refresh grant.
   *
   * When siteOid is provided, the returned token is
   * scoped to the selected Somfy installation.
   *
   * Otherwise, an account-wide token is requested.
   */
  private async performRefresh(
    siteOid: string | null,
  ): Promise<void> {
    if (!this.refreshToken) {
      throw new SomfyAuthError(
        'No Somfy refresh token available',
      );
    }

    const previousRefreshToken = this.refreshToken;

    let url = SOMFY_GINAITE_TOKEN_URL;

    if (siteOid) {
      url += `?siteOID=${encodeURIComponent(siteOid)}`;
    }

    const body = new URLSearchParams();

    body.append('grant_type', 'refresh_token');
    body.append('client_id', SOMFY_CLIENT_ID);
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
      const axiosError = error as AxiosError<{
        error?: string;
        error_description?: string;
      }>;

      if (
        axiosError.response?.data?.error === 'invalid_grant'
      ) {
        throw new SomfyBadCredentialsError(
          axiosError.response.data.error_description ||
            'Somfy refresh token has been revoked',
        );
      }

      throw this.mapHttpError(
        error,
        'Somfy token refresh failed',
      );
    }

    const token = response.data;

    /*
     * Never accept an incomplete refresh response.
     *
     * Retaining an old access token here could incorrectly
     * make the session appear valid.
     */
    if (!token.access_token) {
      throw new SomfyAuthError(
        'Somfy token refresh returned no access token',
      );
    }

    /*
     * Preserve the old refresh token when the server
     * does not issue a replacement.
     */
    if (!token.refresh_token) {
      token.refresh_token = previousRefreshToken;
    }

    this.updateToken(token);

    if (
      typeof token.expires_in !== 'number' ||
      !Number.isFinite(token.expires_in) ||
      token.expires_in <= 0
    ) {
      this.expiresAt =
        Date.now() + FALLBACK_TOKEN_LIFETIME_MS;
    }

    this.tokenSiteOid = siteOid;

    /*
     * Persist the rotated refresh token before reporting
     * the refresh operation as successful.
     */
    await this.notifyTokenRefresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Session persistence                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Notify Node-RED when the OAuth session changes.
   *
   * The complete session is persisted together:
   * - refreshToken
   * - siteOid
   * - gatewayId
   * - region
   *
   * The access token is never persisted.
   */
  private async notifyTokenRefresh(): Promise<void> {
    if (!this.refreshToken) {
      return;
    }

    /*
     * An account-wide token may exist before the user
     * has selected an installation.
     *
     * Such a token cannot yet be exported as a complete
     * Node-RED installation credential.
     */
    if (
      !this.selectedSiteOid ||
      !this.selectedGatewayId ||
      !this.selectedRegion
    ) {
      return;
    }

    const session = this.getSession();

    const changed =
      session.refreshToken !== this.persistedRefreshToken;

    if (!changed) {
      return;
    }

    if (!this.tokenRefreshCallback) {
      if (!this.warnedMissingCallback) {
        this.warnedMissingCallback = true;

        console.warn(
          '[Somfy OAuth] Session changed but no persistence callback is configured. ' +
            'The updated refresh token may not survive a restart.',
        );
      }

      return;
    }

    try {
      await this.tokenRefreshCallback(session);

      /*
       * Update persistence state only after the callback
       * has completed successfully.
       */
      this.persistedRefreshToken = session.refreshToken;

      this.warnedMissingCallback = false;
    } catch {
      /*
       * Do not log the callback error itself because it
       * could accidentally contain credential information.
       *
       * Do not silently treat the token as persisted.
       */
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
   * Return the complete session.
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
   * Export credentials for Node-RED persistence.
   *
   * The access token is deliberately not persisted.
   */
  public toCredentials(): ISomfyTokenState {
    const session = this.getSession();

    this.persistedRefreshToken = session.refreshToken;

    this.warnedMissingCallback = false;

    return session;
  }

  /* ---------------------------------------------------------------------- */
  /* Authentication headers                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Return the authorization headers for the selected installation.
   *
   * Ensures that a valid site-scoped token is available.
   */
  public async getHeaders(): Promise<Record<string, string>> {
    await this.ensureSiteToken();

    if (!this.accessToken) {
      throw new SomfyAuthError(
        'No Somfy access token available',
      );
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Ensure that a valid token scoped to the selected installation
   * is available.
   */
  private async ensureSiteToken(): Promise<void> {
    if (this.closed) {
      throw new SomfyAuthError(
        'Somfy authentication instance is closed',
      );
    }

    if (!this.selectedSiteOid || !this.selectedGatewayId) {
      throw new SomfyNoGatewaySelectedError(
        'No Somfy gateway has been selected',
      );
    }

    if (!this.selectedRegion || !this.selectedEndpoint) {
      throw new SomfyAuthError(
        'No regional Somfy API endpoint is configured',
      );
    }

    if (
      !this.isExpired() &&
      this.tokenSiteOid === this.selectedSiteOid
    ) {
      return;
    }

    if (!this.refreshToken) {
      throw new SomfyAuthError(
        'No Somfy refresh token available',
      );
    }

    await this.refreshTokenWithLock(this.selectedSiteOid);

    if (!this.accessToken || this.isExpired()) {
      throw new SomfyAuthError(
        'Unable to obtain a valid Somfy site-scoped access token',
      );
    }
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
   * Return the available gateways.
   *
   * A copy is returned to prevent external modification
   * of the internal gateway list.
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
   * Authentication headers. This preserves the existing getHeaders() implementation while satisfying SomfyCloudApi.
   */
public async getAuthHeaders(): Promise<Record<string, string>> {
  return this.getHeaders();
}

  /**
   * Return whether a gateway has been selected.
   */
  public get hasSelectedGateway(): boolean {
    return Boolean(
      this.selectedGatewayId &&
        this.selectedSiteOid &&
        this.selectedEndpoint,
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
     * Refresh tokens may be rotated by Ginaite.
     * Preserve the previous token when no replacement is returned.
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
   * This method is useful when the configuration node
   * receives updated credentials without being recreated.
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
      throw new SomfyAuthError(
        'Invalid Somfy OAuth session',
      );
    }

    const endpoint = REGION_ENDPOINTS[session.region];

    if (!endpoint) {
      throw new SomfyAuthError(
        `Unknown Somfy region: ${session.region}`,
      );
    }

    this.refreshToken = session.refreshToken;

    this.persistedRefreshToken = session.refreshToken;

    this.selectedSiteOid = session.siteOid;

    this.selectedGatewayId = session.gatewayId;

    this.selectedRegion = session.region;

    this.selectedEndpoint = endpoint;

    /*
     * The access token is not restored.
     * A new site-scoped token must be obtained.
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
   * It only clears the credentials and tokens held in memory.
   *
   * The method is synchronous for compatibility with existing
   * SomfyCloudApi logout handling.
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

    this.persistedRefreshToken = null;

    this.tokenRefreshCallback = undefined;
  }

  /* ---------------------------------------------------------------------- */
  /* HTTP error handling                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Convert Axios errors into safe Somfy authentication errors.
   *
   * Never include request headers, passwords, tokens or request bodies
   * in an error message.
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

    const axiosError = error as AxiosError<{
      error?: string;
      error_description?: string;
      message?: string;
    }>;

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
     * Network errors.
     */
    if (axiosError.code === 'ECONNABORTED') {
      return new SomfyAuthError(
        'Somfy authentication request timed out',
        undefined,
        'TIMEOUT',
      );
    }

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
