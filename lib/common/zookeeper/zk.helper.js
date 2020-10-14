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
        this.initConstructor();
    }
    ZkHelper_1 = ZkHelper;
    ZkHelper.prototype.initConstructor = function () {
        var _this = this;
        var methodNames = this.getUseMethodNames();
        methodNames.forEach(function (name) {
            var notPromiseFunc = ['getState', 'close', 'createServer', 'listener'].includes(name);
            var senderFunc = _this[name].bind(_this);
            _this[name] = notPromiseFunc
                ? senderFunc
                :
                    function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return __awaiter(_this, void 0, void 0, function () {
                            var isBreak;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        isBreak = !this.hasConnect();
                                        this.logger.log("[ZkHelper-initConstructor] \r\n \u8C03\u7528\u65B9\u6CD5:" + name + " \u8FDE\u63A5\u662F\u5426\u65AD\u5F00\uFF1A" + isBreak + " \u8C03\u7528\u65B9\u6CD5\u53C2\u6570:" + JSON.stringify(args));
                                        if (!(name != 'connect' && isBreak)) return [3, 2];
                                        this.close();
                                        return [4, this.connect()];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [4, senderFunc.apply(void 0, args)];
                                    case 3: return [2, _a.sent()];
                                }
                            });
                        });
                    };
        });
    };
    ZkHelper.prototype.getUseMethodNames = function () {
        return Object.getOwnPropertyNames(ZkHelper_1.prototype).filter(function (key) {
            return !['constructor', 'helper', 'createInstance', 'hasConnect', 'connect'].find(function (name) { return key == name; }) &&
                typeof ZkHelper_1.prototype[key] === 'function';
        });
    };
    ZkHelper.prototype.hasConnect = function () {
        var state = this.getState();
        var stateName = state.getName();
        this.logger.log("[ZkHelper-hasConnect] \r\n zookeeper state:" + stateName);
        return ['CONNECTED_READ_ONLY', 'SYNC_CONNECTED', 'SASL_AUTHENTICATED'].includes(stateName);
    };
    ZkHelper.prototype.getState = function () {
        if (!this.client) {
            this.createServer();
        }
        return this.client.getState();
    };
    ZkHelper.prototype.setACL = function (path, acls, version) {
        if (acls === void 0) { acls = exports.ACLS.OPEN_ACL_UNSAFE; }
        if (version === void 0) { version = -1; }
        var resolve, reject;
        this.client.setACL(path, acls, function (error, acls, stat) {
            if (error) {
                return reject(error);
            }
            resolve(acls);
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.getACL = function (path) {
        var resolve, reject;
        this.client.getACL(path, function (error, acls, stat) {
            if (error) {
                return reject(error);
            }
            resolve(acls);
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.listSubTreeBFS = function (path) {
        var resolve, reject;
        this.client.listSubTreeBFS(path, function (error, children) {
            if (error) {
                return reject(error);
            }
            resolve(children);
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.getChildren = function (path, watcher) {
        var resolve = null, reject = null;
        this.client.getChildren(path, watcher, function (error, children) {
            if (error) {
                if (typeof reject === "function") {
                    reject(error);
                }
                else {
                    typeof watcher === "function" && watcher("error");
                }
                reject = null, resolve = null;
                return;
            }
            typeof resolve === "function" && resolve(children);
            reject = null, resolve = null;
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.mkdirp = function (path, data, acls, mode) {
        if (data === void 0) { data = ''; }
        if (acls === void 0) { acls = exports.ACLS.OPEN_ACL_UNSAFE; }
        if (mode === void 0) { mode = node_zookeeper_client_1.CreateMode.PERSISTENT; }
        var resolve, reject;
        this.client.mkdirp(path, Buffer.from(data), acls, mode, function (error, path) {
            if (error) {
                return reject(error);
            }
            resolve(path);
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.create = function (path, data, acls, mode) {
        if (data === void 0) { data = ''; }
        if (acls === void 0) { acls = exports.ACLS.OPEN_ACL_UNSAFE; }
        if (mode === void 0) { mode = node_zookeeper_client_1.CreateMode.PERSISTENT; }
        var resolve, reject;
        this.client.create(path, Buffer.from(data), acls, mode, function (error, path) {
            if (error) {
                return reject(error);
            }
            resolve(path);
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.remove = function (path, version) {
        if (version === void 0) { version = -1; }
        var resolve, reject;
        this.client.removeRecursive(path, version, function (error) {
            if (error) {
                return reject(error);
            }
            resolve();
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.exists = function (path, watcher) {
        var resolve = null, reject = null;
        this.client.exists(path, watcher, function (error, state) {
            if (error) {
                if (typeof reject === "function") {
                    reject(error);
                }
                else {
                    typeof watcher === "function" && watcher("error");
                }
                reject = null, resolve = null;
                return;
            }
            typeof resolve === "function" && resolve(!!state);
            reject = null, resolve = null;
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.setData = function (path, data, version) {
        if (data === void 0) { data = ''; }
        if (version === void 0) { version = -1; }
        var resolve, reject;
        this.client.setData(path, Buffer.from(data), version, function (error, state) {
            if (error) {
                return reject(error);
            }
            resolve(state);
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.getData = function (path, watcher) {
        var resolve = null, reject = null;
        this.client.getData(path, watcher, function (error, data) {
            if (error) {
                if (typeof reject === "function") {
                    reject(error);
                }
                else {
                    typeof watcher === "function" && watcher("error");
                }
                reject = null, resolve = null;
                return;
            }
            typeof resolve === "function" && resolve(data.toString('utf8'));
            reject = null, resolve = null;
        });
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
        });
    };
    ZkHelper.prototype.listener = function () {
        var _this = this;
        if (!this.client) {
            throw new Error('请初始化zookeeper client.');
        }
        this.client.on('connected', function () {
            _this.logger.log("[zookeeper-listener] zookeeper is connected. sessionID:" + _this.client.getSessionId().toString('hex'));
        });
        this.client.on('disconnected', function () {
            _this.logger.log("zookeeper is disconnected");
        });
        this.client.on('expired', function () {
            _this.logger.log("zookeeper is expired");
        });
        this.client.on('connectedReadOnly', function () {
            _this.logger.log("[zookeeper-listener] zookeeper is connectedReadOnly. sessionID:" + _this.client.getSessionId().toString('hex'));
        });
        this.client.on('authenticationFailed', function () {
            _this.logger.log("authentication failed of zookeeper");
        });
        this.client.on('state', function (state) {
            _this.logger.log("state is change of zookeeper. state:" + state);
        });
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
    ZkHelper.prototype.connect = function () {
        var resolve, reject, timeHandler;
        if (!this.client) {
            this.createServer();
        }
        this.client.once('connected', function () {
            resolve != empty && resolve(), (reject = resolve = empty), timeHandler && clearTimeout(timeHandler);
        });
        this.client.connect();
        timeHandler = setTimeout(function () {
            reject && reject(), (reject = resolve = empty);
        }, 30 * 1000);
        return new Promise(function (res, rej) {
            (resolve = res), (reject = rej);
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
    var ZkHelper_1;
    ZkHelper = ZkHelper_1 = __decorate([
        zego_injector_1.Injectable(),
        __metadata("design:paramtypes", [logger_1.BusinessLogger, zego_config_1.ConfigService])
    ], ZkHelper);
    return ZkHelper;
}());
exports.ZkHelper = ZkHelper;
//# sourceMappingURL=zk.helper.js.map