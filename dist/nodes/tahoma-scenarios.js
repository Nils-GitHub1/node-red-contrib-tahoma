"use strict";
module.exports = (RED) => {
    RED.nodes.registerType('tahoma-scenarios', function (props) {
        RED.nodes.createNode(this, props);
        this['name'] = props.name;
        this['cloudConfig'] = props.cloudConfig;
        this.on('input', async (msg) => {
            try {
                const configNode = RED.nodes.getNode(this['cloudConfig']);
                if (!configNode) {
                    throw new Error('TaHoma Cloud configuration not found');
                }
                const getScenarios = configNode['getScenarios'];
                if (!getScenarios) {
                    throw new Error('TaHoma Cloud scenario manager is unavailable');
                }
                this.status({
                    fill: 'yellow',
                    shape: 'dot',
                    text: 'Retrieving scenarios...',
                });
                const actionGroups = await getScenarios();
                const scenarios = actionGroups.map((group) => ({
                    id: group.id,
                    name: group.name,
                    oid: group.id,
                    label: group.name,
                }));
                msg.payload = scenarios;
                this.status({
                    fill: 'green',
                    shape: 'dot',
                    text: `${scenarios.length} scenario(s) found`,
                });
                this.send(msg);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'Cloud error',
                });
                this.error(`TaHoma scenarios error: ${message}`, msg);
            }
        });
    });
};
