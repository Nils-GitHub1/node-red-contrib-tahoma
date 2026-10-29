<p align="center">
	<img src="docs/images/somfy-logo.png">
</p>

# Somfy Tahoma for Node-RED

Fork of Nikkhow (Nicolas Nunge) package, with merge of @packyr and @blondak forks. With some clean-up, adds (Europe/America/Oceania Somfy server choice for API token generation) and removal (watson/bonjour outdated package as dependency which implied some security vulnerability).

## Important Note for users of legacy v2.x and v1.x of Nikkhow versions (and potentially other forks)

This 3rd version implements a new API released by Somfy (yes, another one). This time, it no longer relies on any cloud-based API, but will directly discuss with your local Tahoma box.

#### What does this mean?

Basically, the only requirement is to host the node-red instance on the same network than your Tahoma box. That's all. No more quotas, no more expiring tokens. Good news, isn't it?

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

## Example flow

![Example Flow](docs/images/example-flow.png)

An example flow can be found in the docs/ folder. Basically, all it does is close and open shutters based on manual triggers. Those can be replaced by some logic (e.g. a node calculating the sunset and sunrise times). The output is sent to a local MQTT broker. 

## Compatibility

This was tested with the following devices:

* IO-HomeControl Roller Shutters
* IO-HomeControl Garage Door
* Sunea IO Awning (thanks to @xeor)

Feel free to send any feedback of any other compatible items or known limitations :)
