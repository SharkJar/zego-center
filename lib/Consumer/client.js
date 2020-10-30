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
        _this.defaultTimer = 3000;
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
        var _this = this;
        if (isNeedWacherWeight === void 0) { isNeedWacherWeight = false; }
        var systemName = params.systemName, serviceName = params.serviceName;
        var serverPath = Path.join(systemName, serviceName);
        isNeedWacherWeight = params.isNeedWacherWeight || isNeedWacherWeight;
        this.subscribeWacherNode(serverPath);
        var callback = typeof listener === "function" ? listener : function () { };
        var noticeSubject = listener instanceof rxjs_1.Subject ? listener : new rxjs_1.Subject();
        noticeSubject.pipe(operators_1.debounceTime(300), operators_1.distinctUntilChanged(function (prev, next) { return prev != null && next != null && JSON.stringify(prev) == JSON.stringify(next); }), operators_1.tap(function (server) { return callback(server); })).subscribe();
        rxjs_1.fromEvent(this, eventName.NODE_CHILD_DELETE + ":" + serverPath)
            .pipe(operators_1.tap(function (event) { return callback(null); }))
            .subscribe(noticeSubject);
        rxjs_1.fromEvent(this, eventName.CHILDNODE_DELETE + ":" + serverPath)
            .pipe(operators_1.switchMap(function (event) { return rxjs_1.of(_this.getNextServer(serverPath)); }))
            .subscribe(noticeSubject);
        isNeedWacherWeight && rxjs_1.fromEvent(this, eventName.CHILDNODE_UPDATE + ":" + serverPath)
            .pipe(operators_1.tap(function (event) { return console.log("节点数据变更"); }), operators_1.switchMap(function (event) { return rxjs_1.of(_this.getNextServer(serverPath)); }))
            .subscribe(noticeSubject);
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
        var systemName = params.systemName, serviceName = params.serviceName;
        var serverPath = Path.join(systemName, serviceName);
        this.removeAllListeners(eventName.CHILDNODE_DELETE + ":" + serverPath);
        this.removeAllListeners(eventName.CHILDNODE_ADD + ":" + serverPath);
        this.removeAllListeners(eventName.CHILDNODE_UPDATE + ":" + serverPath);
        this.unsunscribeNode(serverPath);
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
        var dataSender = { nodePath: path, node: child, subscribe: dataSubscribe, data: null, prevString: null };
        var dataCallback = function (data) {
            try {
                var nextData = JSON.parse(data);
                var prevString = dataSender.prevString;
                dataSender.data = nextData;
                dataSender.prevString = data;
                if (data !== prevString) {
                    _this.logger.log("\u6709\u8282\u70B9\u53D8\u66F4,prev:" + prevString + ". current:" + data);
                    _this.emit(eventName.CHILDNODE_UPDATE, {
                        nodePath: path,
                        childPath: child,
                        prevChildData: dataSender.data,
                        childData: nextData,
                    });
                }
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
                _this.logger.log("\u6839\u8282\u70B9\u88AB\u5220\u9664:" + path);
                return;
            }
            var delNode = Array.from(((_a = nodeSender.childMap) === null || _a === void 0 ? void 0 : _a.keys()) || []).filter(function (child) {
                var _a;
                var result = !children.includes(child);
                if (result) {
                    _this.unsubscribeData(path, child);
                    _this.emit(eventName.CHILDNODE_DELETE, {
                        nodePath: path,
                        childPath: child,
                        childData: (_a = nodeSender.childMap) === null || _a === void 0 ? void 0 : _a.get(child),
                    });
                    _this.logger.log("\u5355\u8282\u70B9\u88AB\u5220\u9664,path:" + path + ". child:" + child);
                }
                return result;
            });
            var addNode = children.filter(function (child) {
                var _a;
                var result = !((_a = nodeSender.childMap) === null || _a === void 0 ? void 0 : _a.has(child));
                if (result) {
                    _this.subscribeWacherData(path, child);
                    _this.emit(eventName.CHILDNODE_ADD, { nodePath: path, childPath: child });
                    _this.logger.log("\u5355\u8282\u70B9\u88AB\u6DFB\u52A0,path:" + path + ". child:" + child);
                }
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
        }), operators_1.retry())
            .subscribe(subscribe);
    };
    CenterClient.prototype.wacherNode = function (sender) {
        var _this = this;
        var _a = sender.timer, timer = _a === void 0 ? this.defaultTimer : _a, subscribe = sender.subscribe, path = sender.path;
        return rxjs_1.interval(timer)
            .pipe(operators_1.switchMap(function (num) { return rxjs_1.from(_this.helper.getChildren(path)); }), operators_1.tap(function (children) {
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