"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
module.exports = function (RED) {
    RED.nodes.registerType('tahoma-scenarios', function (props) {
        var _this = this;
        RED.nodes.createNode(this, props);
        this['name'] = props.name;
        this['cloudConfig'] = props.cloudConfig;
        this.on('input', function (msg) { return __awaiter(_this, void 0, void 0, function () {
            var configNode, getScenarios, actionGroups, scenarios, error_1, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        configNode = RED.nodes.getNode(this['cloudConfig']);
                        if (!configNode) {
                            throw new Error('TaHoma Cloud configuration not found');
                        }
                        getScenarios = configNode['getScenarios'];
                        if (!getScenarios) {
                            throw new Error('TaHoma Cloud scenario manager is unavailable');
                        }
                        this.status({
                            fill: 'yellow',
                            shape: 'dot',
                            text: 'Retrieving scenarios...',
                        });
                        return [4 /*yield*/, getScenarios()];
                    case 1:
                        actionGroups = _a.sent();
                        scenarios = actionGroups.map(function (group) { return ({
                            id: group.id,
                            name: group.name,
                            oid: group.id,
                            label: group.name,
                        }); });
                        msg.payload = scenarios;
                        this.status({
                            fill: 'green',
                            shape: 'dot',
                            text: "".concat(scenarios.length, " scenario(s) found"),
                        });
                        this.send(msg);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        message = error_1 instanceof Error ? error_1.message : String(error_1);
                        this.status({
                            fill: 'red',
                            shape: 'ring',
                            text: 'Cloud error',
                        });
                        this.error("TaHoma scenarios error: ".concat(message), msg);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    });
};
