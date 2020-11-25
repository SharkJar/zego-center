"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkHelper = exports.ACLS = void 0;
var node_zookeeper_client_1 = require("node-zookeeper-client");
var logger_1 = require("../logger/logger");
var zego_injector_1 = require("zego-injector");
var zego_config_1 = require("zego-config");
var empty = function () { };
var IDS = {
    ANYONE_ID_UNSAFE: new node_zookeeper_client_1.Id('world', 'anyone'),
    AUTH_IDS: new node_zookeeper_client_1.Id('auth', ''),
};
exports.ACLS = {
    OPEN_ACL_UNSAFE: [new node_zookeeper_client_1.ACL(node_zookeeper_client_1.Permission.ALL, IDS.ANYONE_ID_UNSAFE)],
    CREATOR_ALL_ACL: [new node_zookeeper_client_1.ACL(node_zookeeper_client_1.Permission.ALL, IDS.AUTH_IDS)],
    READ_ACL_UNSAFE: [new node_zookeeper_client_1.ACL(node_zookeeper_client_1.Permission.READ, IDS.ANYONE_ID_UNSAFE)],
};
var ZkHelper = (function () {
    function ZkHelper(logger, config) {
        this.logger = logger;
        this.config = config;
    }
    ZkHelper.prototype.callLib = function (methodName) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this.client) {
            this.createServer();
        }
        if (!(methodName in this.client) || typeof this.client[methodName] !== 'function') {
            return Promise.reject("[ZkHelper-callLib] - " + methodName + " is not a function.");
        }
        var _a = this.createPromise(), timeout = _a.timeout, success = _a.success, error = _a.error, promise = _a.promise;
        this.connect()
            .then(function () {
            var _a;
            var result = (_a = _this.client)[methodName].apply(_a, args);
            success(result);
        })
            .catch(error);
        return promise;
    };
    ZkHelper.prototype.hasConnect = function () {
        var state = this.getState();
        var stateName = state.getName();
        return ['CONNECTED_READ_ONLY', 'SYNC_CONNECTED', 'SASL_AUTHENTICATED'].includes(stateName);
    };
    ZkHelper.prototype.createPromise = function () {
        var resolve = empty, reject = empty, timeHandler;
        var result = new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
        var complete = function () {
            timeHandler && clearTimeout(timeHandler);
            resolve = reject = empty;
        };
        var success = function (ang) {
            resolve != empty && resolve(ang);
            complete();
        };
        var error = function (ang) {
            reject != empty && reject(ang);
            complete();
        };
        var timeout = function (time) {
            if (time === void 0) { time = 30 * 1000; }
            timeHandler = setTimeout(function () {
                reject != empty && reject('timeout');
                complete();
            }, time);
        };
        return {
            timeout: timeout,
            promise: result,
            success: success,
            error: error,
        };
    };
    ZkHelper.prototype.connect = function () {
        var isConnected = this.hasConnect();
        if (isConnected) {
            return Promise.resolve();
        }
        console.log('connect 12312312');
        var _a = this.createPromise(), timeout = _a.timeout, success = _a.success, error = _a.error, promise = _a.promise;
        this.client.once('connected', success);
        try {
            this.client.connect();
            timeout();
        }
        catch (err) {
            error(err);
        }
        return promise;
    };
    ZkHelper.prototype.getState = function () {
        if (!this.client) {
            this.createServer();
        }
        return this.client.getState();
    };
    ZkHelper.prototype.createServer = function () {
        if (this.client) {
            return this.client;
        }
        this.client = node_zookeeper_client_1.createClient(this.config.get('SERVERS'), {
            sessionTimeout: Number(this.config.get('SESSIONTIMEOUT')),
            spinDelay: Number(this.config.get('SPINDELAY')),
            retries: Number(this.config.get('RETRIES')),
        });
        this.listener();
        return this.client;
    };
    ZkHelper.prototype.getLib = function (methodName) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var _a = this.createPromise(), timeout = _a.timeout, promiseSuccess = _a.success, promiseError = _a.error, promise = _a.promise;
        this.callLib.apply(this, __spreadArrays([methodName], args, [function (error, result, stat) {
                if (error) {
                    _this.logger.error("[ZkHelper-initConstructor] \r\n \u8C03\u7528\u65B9\u6CD5:" + methodName + " \u8C03\u7528\u65B9\u6CD5\u53C2\u6570:" + JSON.stringify(args) + " \u8C03\u7528\u51FA\u9519" + error);
                    return promiseError(error);
                }
                _this.logger.log("[ZkHelper-initConstructor] \r\n \u8C03\u7528\u65B9\u6CD5:" + methodName + " \u8C03\u7528\u65B9\u6CD5\u53C2\u6570:" + JSON.stringify(args) + " \u8FD4\u56DE\u7ED3\u679C:" + JSON.stringify(result));
                promiseSuccess(result);
            }])).catch(promiseError);
        return promise;
    };
    ZkHelper.prototype.setACL = function (path, acls, version) {
        if (acls === void 0) { acls = exports.ACLS.OPEN_ACL_UNSAFE; }
        if (version === void 0) { version = -1; }
        return this.getLib('setACL', path, acls);
    };
    ZkHelper.prototype.getACL = function (path) {
        return this.getLib('getACL', path);
    };
    ZkHelper.prototype.listSubTreeBFS = function (path) {
        return this.getLib('listSubTreeBFS', path);
    };
    ZkHelper.prototype.getChildren = function (path, watcher) {
        return this.getLib('getChildren', path);
    };
    ZkHelper.prototype.mkdirp = function (path, data, acls, mode) {
        if (data === void 0) { data = ''; }
        if (acls === void 0) { acls = exports.ACLS.OPEN_ACL_UNSAFE; }
        if (mode === void 0) { mode = node_zookeeper_client_1.CreateMode.PERSISTENT; }
        return this.getLib('mkdirp', path, Buffer.from(data), acls, mode);
    };
    ZkHelper.prototype.create = function (path, data, acls, mode) {
        if (data === void 0) { data = ''; }
        if (acls === void 0) { acls = exports.ACLS.OPEN_ACL_UNSAFE; }
        if (mode === void 0) { mode = node_zookeeper_client_1.CreateMode.PERSISTENT; }
        return this.getLib('create', path, Buffer.from(data), acls, mode);
    };
    ZkHelper.prototype.remove = function (path, version) {
        if (version === void 0) { version = -1; }
        return this.getLib('removeRecursive', path, version);
    };
    ZkHelper.prototype.exists = function (path, watcher) {
        return this.getLib('exists', path);
    };
    ZkHelper.prototype.setData = function (path, data, version) {
        if (data === void 0) { data = ''; }
        if (version === void 0) { version = -1; }
        return this.getLib('setData', path, Buffer.from(data), version);
    };
    ZkHelper.prototype.getData = function (path, watcher) {
        return this.getLib('getData', path).then(function (data) { return Promise.resolve(data.toString('utf8')); });
    };
    ZkHelper.prototype.listener = function () {
        var _this = this;
        if (!this.client) {
            throw new Error('请初始化zookeeper client.');
        }
        console.log('进入listener 123123');
        this.client.removeAllListeners('connected').on('connected', function () {
            _this.logger.log("[zookeeper-listener] zookeeper is connected. sessionID:" + _this.client.getSessionId().toString('hex'));
        });
        this.client.removeAllListeners('disconnected').on('disconnected', function () {
            _this.logger.log("zookeeper is disconnected");
        });
        this.client.on('expired', function () {
            _this.logger.log("zookeeper is expired");
        });
        this.client.removeAllListeners('connectedReadOnly').on('connectedReadOnly', function () {
            _this.logger.log("[zookeeper-listener] zookeeper is connectedReadOnly. sessionID:" + _this.client.getSessionId().toString('hex'));
        });
        this.client.removeAllListeners('authenticationFailed').on('authenticationFailed', function () {
            _this.logger.log("authentication failed of zookeeper");
        });
        this.client.removeAllListeners('state').on('state', function (state) {
            _this.logger.log("state is change of zookeeper. state:" + state);
        });
        process.removeAllListeners('uncaughtException').on('uncaughtException', function (err) {
            _this.logger.log('Error caught in uncaughtException event:', err);
        });
    };
    ZkHelper.prototype.close = function () {
        this.logger.log('触发close');
        var noop = function () { };
        var client = this.client || { close: noop, removeAllListeners: noop };
        try {
            client.close();
        }
        catch (err) { }
        ['connected', 'disconnected', 'connectedReadOnly', 'authenticationFailed', 'expired', 'state'].forEach(client.removeAllListeners.bind(client));
        delete this.client;
    };
    ZkHelper = __decorate([
        zego_injector_1.Injectable(),
        __metadata("design:paramtypes", [logger_1.BusinessLogger, zego_config_1.ConfigService])
    ], ZkHelper);
    return ZkHelper;
}());
exports.ZkHelper = ZkHelper;
//# sourceMappingURL=zk.helper.js.map