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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessLogger = void 0;
var log4js_1 = require("log4js");
var zego_config_1 = require("zego-config");
var zego_injector_1 = require("zego-injector");
var loggerName = 'zookeeper-helper-sdk';
var log4Instance;
var getLog4Instance = function (baseDir) {
    if (log4Instance != null) {
        return log4Instance;
    }
    baseDir = baseDir && baseDir.trim().length > 0 ? baseDir : './nestjs-log';
    return (log4Instance = log4js_1.configure({
        appenders: {
            default: {
                type: 'dateFile',
                filename: baseDir + "/" + loggerName,
                level: 'all',
                pattern: 'yyyy-MM-dd.log',
                alwaysIncludePattern: true,
                daysToKeep: 7,
            },
        },
        categories: {
            default: { appenders: ['default'], level: 'all' },
            loggerName: { appenders: ['default'], level: 'all' },
        },
    }));
};
var BusinessLogger = (function () {
    function BusinessLogger(config) {
        this.config = config;
        this.context = loggerName;
        this.logger = getLog4Instance(config.get('LOGGERROOT')).getLogger(this.context);
    }
    BusinessLogger.prototype.error = function (message, trace, context) {
        this.logger.error("[" + (context || this.context) + "]  " + message);
    };
    BusinessLogger.prototype.log = function (message, context) {
        this.logger.info("[" + (context || this.context) + "]  " + message);
    };
    BusinessLogger.prototype.warn = function (message, context) {
        this.logger.warn("[" + (context || this.context) + "]  " + message);
    };
    BusinessLogger.prototype.debug = function (message, context) {
        this.logger.debug("[" + (context || this.context) + "]  " + message);
    };
    BusinessLogger.prototype.verbose = function (message, context) {
        this.logger.info("[" + (context || this.context) + "]  " + message);
    };
    BusinessLogger.prototype.setContext = function (context) {
        this.context = context;
    };
    BusinessLogger = __decorate([
        zego_injector_1.Injectable(),
        __metadata("design:paramtypes", [zego_config_1.ConfigService])
    ], BusinessLogger);
    return BusinessLogger;
}());
exports.BusinessLogger = BusinessLogger;
//# sourceMappingURL=logger.js.map