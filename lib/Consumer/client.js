"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CenterClient = void 0;
var zk_helper_1 = require("../common/zookeeper/zk.helper");
var zego_injector_1 = require("zego-injector");
var zego_config_1 = require("zego-config");
var Path = require("path");
var Event = require("events");
var logger_1 = require("../common/logger/logger");
var balance_weight_round_robin_1 = require("../common/balancers/balance.weight.round.robin");
var eventName;
(function (eventName) {
    eventName["NODE_CHILD_DELETE"] = "node-child-delete";
    eventName["NODE_CHILD_ADD"] = "node-child-add";
    eventName["CHILDNODE_DELETE"] = "child-delete";
    eventName["CHILDNODE_ADD"] = "child-add";
    eventName["CHILDNODE_UPDATE"] = "child-update";
})(eventName || (eventName = {}));
var CenterClient = (function (_super) {
    __extends(CenterClient, _super);
    function CenterClient(helper, config, logger) {
        var _this = _super.call(this) || this;
        _this.helper = helper;
        _this.config = config;
        _this.logger = logger;
        _this.nodes = new Map();
        _this.distributionEvent();
        return _this;
    }
    CenterClient.prototype.distributionEvent = function () {
        var _this = this;
        var events = [
            eventName.NODE_CHILD_DELETE,
            eventName.CHILDNODE_DELETE,
            eventName.NODE_CHILD_ADD,
            eventName.CHILDNODE_ADD,
            eventName.CHILDNODE_UPDATE,
        ];
        events.forEach(function (name) {
            _this.on(name, function (sender) { return _this.emit(name + ":" + sender.nodePath, sender); });
        });
    };
    CenterClient.prototype.wacherNode = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var childMap, children, isExistsNode, childrenPath, delNode, addNode;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        childMap = this.nodes.get(path);
                        return [4, this.helper.getChildren(path, this.wacherNode.bind(this, path))];
                    case 1:
                        children = (_a.sent());
                        if (!children || !Array.isArray(children) || children.length <= 0) {
                            this.nodes.delete(path);
                            isExistsNode = (childMap === null || childMap === void 0 ? void 0 : childMap.size) && (childMap === null || childMap === void 0 ? void 0 : childMap.size) > 0;
                            if (isExistsNode) {
                                childrenPath = Array.from((childMap === null || childMap === void 0 ? void 0 : childMap.keys()) || []);
                                this.emit(eventName.NODE_CHILD_DELETE, { nodePath: path, childrenPath: childrenPath });
                                childrenPath.forEach(function (childPath) {
                                    return _this.emit(eventName.CHILDNODE_DELETE, { nodePath: path, childPath: childPath, childData: childMap === null || childMap === void 0 ? void 0 : childMap.get(childPath) });
                                });
                            }
                            return [2];
                        }
                        this.nodes.set(path, new Map());
                        delNode = Array.from((childMap === null || childMap === void 0 ? void 0 : childMap.keys()) || []).filter(function (child) { return !children.includes(child); });
                        addNode = children.filter(function (child) { return !(childMap === null || childMap === void 0 ? void 0 : childMap.has(child)); });
                        if (delNode.length > 0) {
                            this.emit(eventName.NODE_CHILD_DELETE, { nodePath: path, childrenPath: delNode });
                            delNode.forEach(function (childPath) {
                                return _this.emit(eventName.CHILDNODE_DELETE, { nodePath: path, childPath: childPath, childData: childMap === null || childMap === void 0 ? void 0 : childMap.get(childPath) });
                            });
                        }
                        if (!(addNode.length > 0)) return [3, 3];
                        this.emit(eventName.NODE_CHILD_ADD, { nodePath: path, childrenPath: addNode });
                        return [4, Promise.all(addNode.map(function (child) { return __awaiter(_this, void 0, void 0, function () {
                                var data;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4, this.wacherData(path, child)];
                                        case 1:
                                            data = _a.sent();
                                            this.emit(eventName.CHILDNODE_ADD, { nodePath: path, childPath: child, childData: data });
                                            return [2];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4, Promise.all(children.filter(function (child) { return !addNode.includes(child); }).map(this.wacherData.bind(this, path)))];
                    case 4:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    CenterClient.prototype.wacherData = function (nodePath, child) {
        return __awaiter(this, void 0, void 0, function () {
            var childrenNode, currentChild, childPath, data, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.nodes.has(nodePath)) {
                            return [2];
                        }
                        childrenNode = this.nodes.get(nodePath);
                        currentChild = (childrenNode === null || childrenNode === void 0 ? void 0 : childrenNode.get(child)) || { data: null };
                        childPath = Path.join(nodePath, child);
                        return [4, this.helper.getData(childPath, this.wacherData.bind(this, nodePath, child))];
                    case 1:
                        data = (_a.sent());
                        try {
                            result = JSON.parse(data);
                            if (data !== JSON.stringify(currentChild.data)) {
                                this.emit(eventName.CHILDNODE_UPDATE, {
                                    nodePath: nodePath,
                                    childPath: child,
                                    prevChildData: currentChild.data,
                                    childData: result,
                                });
                            }
                            childrenNode === null || childrenNode === void 0 ? void 0 : childrenNode.set(child, { node: child, nodePath: nodePath, data: result });
                            return [2, result];
                        }
                        catch (err) { }
                        return [2, null];
                }
            });
        });
    };
    CenterClient.prototype.getNextServer = function (serverPath) {
        var childNodeMap = this.nodes.get(serverPath);
        var serverList = Array.from((childNodeMap === null || childNodeMap === void 0 ? void 0 : childNodeMap.values()) || []).map(function (sender) {
            var data = sender.data;
            return { address: data.ip + ":" + data.port, ip: data.ip, port: data.port, weight: data.weight };
        });
        if (!serverList || !Array.isArray(serverList) || serverList.length <= 0) {
            return null;
        }
        var balanceHelper = new balance_weight_round_robin_1.WeightRoundRobin(serverList, 1);
        var nextServerIP = balanceHelper.getAddress();
        return serverList.find(function (sender) { return sender.address === nextServerIP; });
    };
    CenterClient.prototype.listenerServer = function (serverPath, listener) {
        return __awaiter(this, void 0, void 0, function () {
            var resolve, reject, list;
            var _this = this;
            return __generator(this, function (_a) {
                list = listener;
                list.handler && clearTimeout(list.handler);
                list.handler = setTimeout(function () {
                    var server = _this.getNextServer(serverPath);
                    listener(server);
                    resolve && resolve(server);
                    resolve = reject = null;
                }, 3000);
                return [2, new Promise(function (res, rej) {
                        (resolve = res), (reject = rej);
                    })];
            });
        });
    };
    CenterClient.prototype.subscribe = function (params, listener, isNeedWacherWeight) {
        if (isNeedWacherWeight === void 0) { isNeedWacherWeight = false; }
        return __awaiter(this, void 0, void 0, function () {
            var systemName, serviceName, serverPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemName = params.systemName, serviceName = params.serviceName;
                        serverPath = Path.join(systemName, serviceName);
                        return [4, this.wacherNode(serverPath)];
                    case 1:
                        _a.sent();
                        this.on(eventName.CHILDNODE_DELETE + ":" + serverPath, this.listenerServer.bind(this, serverPath, listener));
                        this.on(eventName.CHILDNODE_ADD + ":" + serverPath, this.listenerServer.bind(this, serverPath, listener));
                        isNeedWacherWeight && this.on(eventName.CHILDNODE_UPDATE + ":" + serverPath, this.listenerServer.bind(this, serverPath, listener));
                        return [4, this.listenerServer(serverPath, listener)];
                    case 2: return [2, _a.sent()];
                }
            });
        });
    };
    CenterClient.prototype.unSubscribe = function (params, listener) {
        return __awaiter(this, void 0, void 0, function () {
            var systemName, serviceName, serverPath;
            return __generator(this, function (_a) {
                systemName = params.systemName, serviceName = params.serviceName;
                serverPath = Path.join(systemName, serviceName);
                this.removeAllListeners(eventName.CHILDNODE_DELETE + ":" + serverPath);
                this.removeAllListeners(eventName.CHILDNODE_ADD + ":" + serverPath);
                this.removeAllListeners(eventName.CHILDNODE_UPDATE + ":" + serverPath);
                return [2];
            });
        });
    };
    CenterClient = __decorate([
        zego_injector_1.Injectable(),
        __metadata("design:paramtypes", [zk_helper_1.ZkHelper, zego_config_1.ConfigService, logger_1.BusinessLogger])
    ], CenterClient);
    return CenterClient;
}(Event.EventEmitter));
exports.CenterClient = CenterClient;
//# sourceMappingURL=client.js.map