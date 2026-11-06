"use strict";
module.exports = (RED) => {
    RED.nodes.registerType('tahoma-scenario-control', function (props) {
        RED.nodes.createNode(this, props);
        this['name'] = props.name;
        this['cloudConfig'] = props.cloudConfig;
        this['scenarioId'] = props.scenarioId;
        this['timeout'] = props.timeout ?? 300;
        const node = this;
        node.on('input', async (msg) => {
            try {
                const configNode = RED.nodes.getNode(this['cloudConfig']);
                if (!configNode) {
                    throw new Error('TaHoma Cloud configuration not found');
                }
                const getScenarioById = configNode['getScenarioById'];
                if (!getScenarioById) {
                    throw new Error('TaHoma Cloud scenario lookup is unavailable');
                }
                const executeScenario = configNode['executeScenario'];
                if (!executeScenario) {
                    throw new Error('TaHoma Cloud scenario execution manager is unavailable');
                }
                const payload = msg.payload;
                const scenarioId = typeof msg.payload === 'string'
                    ? msg.payload
                    : payload && typeof payload.scenarioId === 'string'
                        ? payload.scenarioId
                        : this['scenarioId'];
                if (!scenarioId || typeof scenarioId !== 'string') {
                    throw new Error('No scenario selected. Configure a scenario or provide msg.payload.scenarioId');
                }
                if (!getScenarioById) {
                    throw new Error('TaHoma Cloud scenario lookup is unavailable');
                }
                const scenario = await getScenarioById(scenarioId);
                const scenarioName = scenario?.name;
                const timeoutSeconds = Number(this['timeout'] ?? 300);
                if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 0) {
                    throw new Error('Scenario timeout must be a non-negative number');
                }
                this.status({
                    fill: 'yellow',
                    shape: 'dot',
                    text: timeoutSeconds > 0
                        ? 'Executing and waiting for scenario...'
                        : 'Executing scenario...',
                });
                const execution = await executeScenario(scenarioId, timeoutSeconds);
                msg.payload = {
                    scenarioId,
                    execId: execution.execId,
                    name: scenarioName,
                };
                this.status({
                    fill: 'green',
                    shape: 'dot',
                    text: timeoutSeconds > 0
                        ? 'Scenario completed'
                        : 'Scenario execution requested',
                });
                this.send(msg);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'Scenario execution failed',
                });
                this.error(`TaHoma scenario error: ${message}`, msg);
            }
        });
    });
};
