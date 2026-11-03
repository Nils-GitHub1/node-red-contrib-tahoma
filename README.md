<p align="center">
	<img src="docs/images/somfy-logo.png">
</p>

# Somfy Tahoma for Node-RED

Since version **3.3.2**, this package supports two complementary ways to interact with your Somfy TaHoma installation.

## Two ways to control your Somfy devices

### 1. Local device control – TaHoma Local API

Control your Somfy devices directly from Node-RED through your local TaHoma box.

- Direct communication between Node-RED and your TaHoma box.
- No dependency on Somfy Cloud for normal device control.
- No cloud API quotas or OAuth token management.
- Requires Node-RED and your TaHoma box to be connected to the same local network.
- Requires activation of Somfy Developer Mode. This [guide](https://github.com/Somfy-Developer/Somfy-TaHoma-Developer-Mode) will walk you through this process.

### 2. Cloud scenario control – Somfy OAuth

Retrieve and execute scenarios that you have created using the Somfy mobile application or Somfy Cloud.

- Uses the new Somfy OAuth authentication mechanism.
- Automatically manages access tokens and refresh tokens.
- Supports installation discovery and gateway selection.
- Allows you to execute your existing Somfy scenarios directly from Node-RED.
- Requires an internet connection and access to Somfy Cloud.

**Both operating modes can be used simultaneously.** You can control individual devices locally while also executing scenarios through Somfy Cloud.

Obviously, each approach has its advantages and limitations. Local control avoids cloud dependency, while Cloud scenario control gives you access to the scenarios already configured in your Somfy environment.

The choice is yours, depending on your requirements, including risks related to lost of internet access.

### Which Somfy account should I use?

For Cloud scenario control, you can use your existing Somfy account, however creating a separate account through the Somfy mobile application is recommended.

If you create a separate account, make sure it has the appropriate permissions to access and execute scenarios. The Resident role is recommended; Guest permissions are not sufficient.


### Origin and History

Fork of Nikkhow (Nicolas Nunge) package, with merge of @packyr and @blondak forks. With some clean-up, adds (Europe/America/Oceania Somfy server choice for API token generation) and removal (watson/bonjour outdated package as dependency which implied some security vulnerability). Important Note for users of legacy v2.x and v1.x of Nikkhow versions (and potentially other forks)
This 3rd version implements a new API released by Somfy (yes, another one). This time, the local device control nodes no longer relies on any cloud-based API, but will directly discuss with your local Tahoma box.
The cloud scenario control code / nodes introduced in release 3.3.2 implement the Somfy OAuth authentication mechanism adapted from the python-overkiz-api,
copyright (c) 2020 Mick Vleeshouwer, original repository: https://github.com/iMicknl/python-overkiz-api.

#### How to upgrade?

Even though your flows should not be modified, the [config-node](https://nodered.org/docs/user-guide/editor/workspace/nodes#configuration-nodes) must be reconfigured using this new API.

The Node IDs of this fork have been kept the same as the Nikkow version to ease the transition of existing Node Red flows (export your flows, uninstall Nikkow package, install this one, import your flows).

**However**, please note that even though this release was tested before being published, you might encounter unexpected issues. **Please backup your flow before proceeding with this major release**.

## 🚨 Setup

You can read this [guide](https://nodered.org/docs/getting-started/adding-nodes) from Node-RED official portal. This will help you install this node. Typically, the command are as follows:

	cd $HOME/.node-red
	npm install @nils-github1/node-red-contrib-tahoma 

## Disclaimer
This software is provided **as-is**. Be careful: your devices can be fully controlled via API actions. I am not responsible of any mis-usage or corruption of the devices configuration.

## Configuration

This node relies on the Local API provided by Somfy, and available on the Tahoma box (from v2 onwards -as per Somfy documentation). 

You will need to **enable the developer mode** on your Somfy account to use this module. This [guide](https://github.com/Somfy-Developer/Somfy-TaHoma-Developer-Mode) will walk you through this process.

When creating your first node, you will be asked to configure the TaHoma Box config node. For this, your will have to provide temporarily your e-mail and password used to login to your TaHoma mobile app. These will be used to generate a token to interact with your box (they will not be saved at all on your instance). The pin code of your TaHoma box will also be required. This information is available in the TaHoma mobile app and on the sticker below the box.

## Usage

### Node `tahoma`

This node accepts a JSON object as msg.payload input. The following properties will be parsed:

| Property | Type | Required? | Description |
| -------- | ---- | --------- | ----------- |
| `action` | enum (see below) | **Yes** | The action to perform |
| `position` | int (0-100) | *No* | The position you want to set your blinds/door to |
| `rotation` | int (0-100) | *No* | The rotation you want to set your blinds to |
| `lowspeed` | boolean | *No* | Should the action be triggered in low-speed mode? |

#### Actions

Currently, only a few commands are understood by this node. The possible values for the `action` property are:

* `open`: This will open the device (door, blind...)
* `close`: This will close the device
* `on`: This will set the device ON (light, ...)
* `off`: This will set the device OFF (light, ...)
* `setOnOff`: This will set the device ON or OFF (light, ...). The action is passed using the `onOff` boolean property (1=ON, 0=OFF), which is required in this mode.
* `setIntensity`: This will set the device intensity (light, ...). The action is passed using the `intensity` property, which is required in this mode.
* `toggle`: This will toggle the device
* `stop`: This will stop all running actions
* `my`: This will move a compatible blind to its programmed Somfy favorite ("My") position.No `position` parameter is required.
* `customPosition`: This will set the device to a custom position. The position is passed using the `position` property, which is required in this mode.
* `customRotation` or `customOrientation`: This will set the device (blinds) to a custom rotation. The rotation is passed using the `orientation` property, which is required in this mode.
* `customClosureAndOrientation`: This will set the device (blinds) to a custom closure and rotation. The rotation is passed using the `orientation` property and the position is passed using the `position` property, which are both required in this mode.
* `wink`: This will make the device wink. The action is passed using the `repetitions` property, which are both required in this mode.

#### Output

The node will output its original `msg.payload` enriched with the result of the expected action. `msg.payload.output` will contain 2 properties:

* `open`: a boolean. Set to true if the device is open, or false otherwise
* `position`: an integer (0-100). Set to the position returned by the Tahoma box.
* `luminance`: in case of a Sun Sensor, returns the current value of core:LuminanceState (See issue [#6](https://github.com/nikkow/node-red-contrib-tahoma/issues/6))

### Node `tahoma-read`

This node will ignore all data provided as input. You can specify the desired device by editing the node properties.
(Note: you can still trigger a `tahoma-read` instuction periodically by using an `inject` node. See [#28](https://github.com/nikkow/node-red-contrib-tahoma/issues/28#issuecomment-615755280))

#### Output

The node will output its original `msg.payload` enriched with the selected device information. The fields returned are the raw information sent by the Tahoma box.

### Node `tahoma-scenarios`

This node retrieves the list of scenarios available in your Somfy account through the Somfy Cloud API.

The scenarios are those previously created using the Somfy mobile application or Somfy Cloud.

**Configuration:**

- Select the Tahoma Configuration node associated with your Somfy account.
- Configure the authentication method to use Somfy OAuth.
- Select the appropriate Somfy installation/gateway when prompted.

**How it works:**

- At Node-RED startup, the configuration node authenticates with Somfy Cloud and retrieves the available scenarios.
- The scenarios are cached by the configuration node to avoid unnecessary API requests.
- The node can retrieve the available scenarios from this cache.
- A refresh operation allows the scenario list to be retrieved again from Somfy Cloud.

This node is useful when you want to retrieve the available scenarios dynamically, for example to populate a dashboard, create a selection list or build automated flows.

### Node `tahoma-scenario-control`

This node allows you to execute scenarios that have already been created in your Somfy mobile application or Somfy Cloud account.

Instead of controlling individual devices through the local TaHoma API, this node triggers an existing Somfy scenario through Somfy Cloud.

**Configuration:**

- Select the Tahoma Configuration node associated with your Somfy account.
- Configure the authentication method to use Somfy OAuth.
- Select the appropriate Somfy installation/gateway.

**Input:**

If "Use msg.payload.scenarioId (Dynamic)" is selected as Scenario in the node, the node expects a scenario ID to identify the scenario to execute.
The scenario ID can be obtained using the `tahoma-scenarios` node.

Else if a specific scenario is selected in the node, any input will trigger the action.

**How it works:**

- The node uses the authentication session managed by its associated Tahoma Configuration node.
- OAuth access tokens are refreshed automatically when necessary.
- Updated OAuth session credentials are persisted by Node-RED.
- The selected scenario is executed through Somfy Cloud.
- The execution result is returned in the output message.

**Important:** Scenario execution is not automatically retried if an authentication error occurs. This is intentional to avoid accidentally executing the same scenario more than once.

### Somfy Cloud authentication (OAuth)

The new Cloud nodes use the Somfy OAuth authentication mechanism, adapted from the Python Overkiz API implementation.

The Tahoma Configuration node supports the following authentication methods:

- **OAuth (recommended for Cloud):** Uses the new Somfy authentication mechanism with access-token and refresh-token management.
- **Legacy:** Retains the previous authentication method where supported.

When using OAuth:

- Your Somfy email and password are used for the initial authentication.
- OAuth refresh tokens are used to maintain the session.
- Credentials and session information are stored using Node-RED's encrypted credential storage.
- The selected installation and gateway are associated with the stored OAuth session.

Each Tahoma Configuration node maintains its own independent authentication session and scenario cache.

You can therefore configure multiple Tahoma Configuration nodes using different Somfy accounts, even if those accounts access the same Somfy installation.

Multiple Cloud nodes can share the same Tahoma Configuration node and reuse its authentication session and scenario cache.

**Authentication architecture**
The implementation follows this sequence:

Somfy username and password
          |
Somfy Accounts OAuth token
          |
Ginaite token exchange
          |
BOB API: installation discovery
          |
Gateway selection and site-scoped token
          |
TaHoma API requests

This distinction is important because the BOB API needs an account-wide token, whereas the TaHoma API needs a token scoped to the selected installation.
The code explicitly handles those two scopes.

## Example flow

![Example Flow](docs/images/example-flow.png)

An example flow can be found in the docs/ folder. Basically, all it does is close and open shutters based on manual triggers. Those can be replaced by some logic (e.g. a node calculating the sunset and sunrise times). The output is sent to a local MQTT broker. 

## Compatibility

This was tested with the following devices:

* IO-HomeControl Roller Shutters
* IO-HomeControl Garage Door
* Sunea IO Awning (thanks to @xeor)

Feel free to send any feedback of any other compatible items or known limitations :)
