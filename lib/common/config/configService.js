"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigParamDecorator = exports.ConfigPropertyDecorator = exports.ConfigManage = exports.ConfigService = void 0;
require("reflect-metadata");
var dotenv = require("dotenv");
var injectable_1 = require("../injector/injectable");
var ConfigService = (function () {
    function ConfigService(dotenv) {
        if (dotenv === void 0) { dotenv = {}; }
        this.dotenv = dotenv;
        this.config = new Map();
        this.mergeMap(dotenv);
    }
    ConfigService.prototype.mergeMap = function (dotenv) {
        if (dotenv === void 0) { dotenv = {}; }
        var _a = dotenv.parsed, parsed = _a === void 0 ? {} : _a;
        Object.keys(parsed).reduce(function (map, key) {
            map.set(key, parsed[key]);
            return map;
        }, this.config);
    };
    ConfigService.prototype.get = function (key) {
        return this.config.get(key);
    };
    ConfigService.prototype.has = function (key) {
        return this.config.has(key);
    };
    ConfigService.prototype.delete = function (key) {
        return this.config.delete(key);
    };
    ConfigService.prototype.valueOf = function () {
        var _this = this;
        return Array.from(this.config.keys()).reduce(function (sender, currentKey) {
            sender[currentKey] = _this.config.get(currentKey);
            return sender;
        }, {});
    };
    return ConfigService;
}());
exports.ConfigService = ConfigService;
var ConfigManage = (function () {
    function ConfigManage() {
    }
    ConfigManage.craete = function (configPath) {
        if (!configPath) {
            return ConfigManage.config;
        }
        configPath = typeof configPath === "string" ? [configPath] : configPath;
        return configPath.reduce(function (config, path) {
            var env = dotenv.config({ path: path, encoding: "utf8" });
            config.mergeMap(env);
            return config;
        }, ConfigManage.config);
    };
    ConfigManage.get = function (key) {
        return ConfigManage.config.get(key);
    };
    ConfigManage.has = function (key) {
        return ConfigManage.config.has(key);
    };
    ConfigManage.toObject = function () {
        return ConfigManage.config.valueOf();
    };
    ConfigManage.config = new ConfigService();
    return ConfigManage;
}());
exports.ConfigManage = ConfigManage;
exports.ConfigPropertyDecorator = function (configPath) {
    return injectable_1.createPropertyDecorator({
        factory: function () { return ConfigManage.craete(configPath); }
    });
};
exports.ConfigParamDecorator = function (configPath) {
    return injectable_1.createParamDecorator({
        factory: function () { return ConfigManage.craete(configPath); }
    });
};
//# sourceMappingURL=configService.js.map