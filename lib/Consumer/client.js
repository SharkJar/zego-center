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
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
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
        _this.defaultTimer = 1500;
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
    CenterClient.prototype.subscribe = function (params, listener, isNeedWacherWeight) {
        if (isNeedWacherWeight === void 0) { isNeedWacherWeight = false; }
        return __awaiter(this, void 0, void 0, function () {
            var systemName, serviceName, serverPath, events;
            var _this = this;
            return __generator(this, function (_a) {
                systemName = params.systemName, serviceName = params.serviceName;
                serverPath = Path.join(systemName, serviceName);
                this.subscribeWacherNode(serverPath);
                events = [
                    rxjs_1.fromEvent(this, eventName.NODE_CHILD_DELETE + ":" + serverPath),
                    rxjs_1.fromEvent(this, eventName.CHILDNODE_DELETE + ":" + serverPath),
                    rxjs_1.fromEvent(this, eventName.CHILDNODE_ADD + ":" + serverPath),
                ];
                isNeedWacherWeight && events.push(rxjs_1.fromEvent(this, eventName.CHILDNODE_UPDATE + ":" + serverPath));
                rxjs_1.merge.apply(void 0, events).pipe(operators_1.debounceTime(300), operators_1.switchMap(function (sender) { return rxjs_1.of(_this.getNextServer(serverPath)); }), operators_1.distinctUntilChanged(function (prevServer, nextServer) {
                    return JSON.stringify(prevServer) == JSON.stringify(nextServer);
                }), operators_1.tap(function (sender) { return typeof listener === 'function' && listener(sender); }), operators_1.retry())
                    .subscribe();
                return [2];
            });
        });
    };
    CenterClient.prototype.getNextServer = function (serverPath) {
        var _a;
        var childNodeMap = this.nodes.get(serverPath);
        var serverList = Array.from(((_a = childNodeMap === null || childNodeMap === void 0 ? void 0 : childNodeMap.childMap) === null || _a === void 0 ? void 0 : _a.values()) || [])
            .filter(function (sender) { return sender.data; })
            .map(function (sender) {
            var _a = sender.data || { ip: '', port: 0, weight: 0 }, ip = _a.ip, port = _a.port, weight = _a.weight;
            return { address: ip + ":" + port, ip: ip, port: port, weight: weight };
        });
        if (!serverList || !Array.isArray(serverList) || serverList.length <= 0) {
            return null;
        }
        var balanceHelper = new balance_weight_round_robin_1.WeightRoundRobin(serverList, 1);
        var nextServerIP = balanceHelper.getAddress();
        return serverList.find(function (sender) { return sender.address === nextServerIP; });
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
                this.unsunscribeNode(serverPath);
                return [2];
            });
        });
    };
    CenterClient.prototype.unsunscribeNode = function (nodePath) {
        var _this = this;
        if (!this.nodes.has(nodePath)) {
            return;
        }
        var _a = this.nodes.get(nodePath) || {}, subscribe = _a.subscribe, childMap = _a.childMap;
        if (typeof childMap !== 'undefined' && childMap instanceof Map) {
            var children = Array.from(childMap.values());
            children.forEach(function (_a) {
                var node = _a.node, data = _a.data;
                _this.unsubscribeData(nodePath, node);
            });
        }
        subscribe && typeof subscribe.unsubscribe === 'function' && subscribe.unsubscribe();
        this.nodes.delete(nodePath);
    };
    CenterClient.prototype.unsubscribeData = function (nodePath, child) {
        if (!this.nodes.has(nodePath)) {
            return;
        }
        var childMap = (this.nodes.get(nodePath) || {}).childMap;
        if (!(childMap instanceof Map) || !(childMap === null || childMap === void 0 ? void 0 : childMap.has(child))) {
            return;
        }
        var subscribe = ((childMap === null || childMap === void 0 ? void 0 : childMap.get(child)) || {}).subscribe;
        subscribe && typeof subscribe.unsubscribe === 'function' && subscribe.unsubscribe();
        childMap.delete(child);
    };
    CenterClient.prototype.subscribeWacherData = function (path, child) {
        var _this = this;
        var _a;
        if (!this.nodes.has(path)) {
            return;
        }
        var nodeSender = this.nodes.get(path) || { childMap: null };
        var childMap = (nodeSender.childMap = nodeSender.childMap || new Map());
        if (childMap.has(child)) {
            return (_a = childMap.get(child)) === null || _a === void 0 ? void 0 : _a.subscribe;
        }
        var subscribe = new rxjs_1.Subject();
        var dataSubscribe = this.wacherData({ path: Path.join(path, child), subscribe: subscribe });
        var dataSender = { nodePath: path, node: child, subscribe: dataSubscribe, data: null };
        var dataCallback = function (data) {
            try {
                var result = JSON.parse(data);
                if (data !== JSON.stringify(dataSender.data)) {
                    _this.emit(eventName.CHILDNODE_UPDATE, {
                        path: path,
                        childPath: child,
                        prevChildData: dataSender.data,
                        childData: result,
                    });
                }
                dataSender.data = result;
            }
            catch (err) { }
        };
        subscribe.pipe(operators_1.tap(dataCallback)).subscribe({
            next: function (value) {
            },
        });
        childMap.set(child, dataSender);
        return dataSubscribe;
    };
    CenterClient.prototype.subscribeWacherNode = function (path) {
        var _this = this;
        var _a;
        if (this.nodes.has(path)) {
            return (_a = this.nodes.get(path)) === null || _a === void 0 ? void 0 : _a.subscribe;
        }
        var subscribe = new rxjs_1.Subject();
        var nodeSubscribe = this.wacherNode({ path: path, subscribe: subscribe });
        var nodeSender = { subscribe: nodeSubscribe, childMap: new Map() };
        var childrenCallback = function (children) {
            var _a;
            if (!children || !Array.isArray(children) || children.length <= 0) {
                var children_1 = Array.from(nodeSender.childMap.values());
                children_1.forEach(function (_a) {
                    var node = _a.node, data = _a.data;
                    _this.unsubscribeData(path, node);
                    nodeSender.childMap.delete(node);
                    _this.emit(eventName.CHILDNODE_DELETE, { nodePath: path, childPath: node, childData: data });
                });
                nodeSender.childMap = new Map();
                _this.emit(eventName.NODE_CHILD_DELETE, { nodePath: path, childrenPath: children_1 });
                return;
            }
            var delNode = Array.from(((_a = nodeSender.childMap) === null || _a === void 0 ? void 0 : _a.keys()) || []).filter(function (child) {
                var _a;
                var result = !children.includes(child);
                _this.emit(eventName.CHILDNODE_DELETE, {
                    nodePath: path,
                    childPath: child,
                    childData: (_a = nodeSender.childMap) === null || _a === void 0 ? void 0 : _a.get(child),
                });
                return result;
            });
            var addNode = children.filter(function (child) {
                var _a;
                var result = !((_a = nodeSender.childMap) === null || _a === void 0 ? void 0 : _a.has(child));
                _this.subscribeWacherData(path, child);
                _this.emit(eventName.CHILDNODE_ADD, { nodePath: path, childPath: child });
                return result;
            });
            if (delNode.length > 0) {
                _this.emit(eventName.NODE_CHILD_DELETE, { nodePath: path, childrenPath: delNode });
            }
            if (addNode.length > 0) {
                _this.emit(eventName.NODE_CHILD_ADD, { nodePath: path, childrenPath: addNode });
            }
        };
        subscribe.pipe(operators_1.tap(childrenCallback)).subscribe({
            next: function (value) {
            },
        });
        this.nodes.set(path, nodeSender);
        return nodeSubscribe;
    };
    CenterClient.prototype.wacherData = function (sender) {
        var _this = this;
        var _a = sender.timer, timer = _a === void 0 ? this.defaultTimer : _a, subscribe = sender.subscribe, path = sender.path;
        return rxjs_1.interval(timer)
            .pipe(operators_1.switchMap(function (num) { return rxjs_1.from(_this.helper.getData(path)); }), operators_1.tap(function (data) {
            console.log(data, 'wacherData');
        }), operators_1.retry())
            .subscribe(subscribe);
    };
    CenterClient.prototype.wacherNode = function (sender) {
        var _this = this;
        var _a = sender.timer, timer = _a === void 0 ? this.defaultTimer : _a, subscribe = sender.subscribe, path = sender.path;
        return rxjs_1.interval(timer)
            .pipe(operators_1.switchMap(function (num) { return rxjs_1.from(_this.helper.getChildren(path)); }), operators_1.tap(function (children) {
            console.log(children, 'wacherNode');
        }), operators_1.retry())
            .subscribe(subscribe);
    };
    CenterClient = __decorate([
        zego_injector_1.Injectable(),
        __metadata("design:paramtypes", [zk_helper_1.ZkHelper, zego_config_1.ConfigService, logger_1.BusinessLogger])
    ], CenterClient);
    return CenterClient;
}(Event.EventEmitter));
exports.CenterClient = CenterClient;
//# sourceMappingURL=client.js.map