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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = exports.IsInjectable = exports.Injectable = exports.createParamDecorator = exports.createPropertyDecorator = exports.createFunctionDecorator = void 0;
require("reflect-metadata");
var constan_1 = require("../constan/constan");
exports.createFunctionDecorator = function (options) {
    return function (target, propertyName, propertyDescriptor) {
        var methodParams = Reflect.getMetadata(constan_1.METHOD_DECORATOR, target.constructor);
        options.propertyName = propertyName;
        methodParams = Array.isArray(methodParams) ? methodParams : [];
        methodParams.push(options);
        Reflect.defineMetadata(constan_1.METHOD_DECORATOR, methodParams, target.constructor);
        return propertyDescriptor;
    };
};
exports.createPropertyDecorator = function (options) {
    return function (target, propertyName) {
        var propertyParams = Reflect.getMetadata(constan_1.PROPERTY_DECORATOR, target.constructor);
        options.propertyName = propertyName;
        propertyParams = Array.isArray(propertyParams) ? propertyParams : [];
        propertyParams.push(options);
        Reflect.defineMetadata(constan_1.PROPERTY_DECORATOR, propertyParams, target.constructor);
    };
};
exports.createParamDecorator = function (options) {
    return function (target, methodName, paramIndex) {
        var params = Reflect.getMetadata(constan_1.PARAM_DECORATOR, target.constructor);
        var types = Reflect.getMetadata(constan_1.PARAM_TYPES, target, methodName) || [];
        options.paramIndex = paramIndex;
        options.methodName = methodName;
        options.type = types[paramIndex];
        params = Array.isArray(params) ? params : [];
        params.push(options);
        Reflect.defineMetadata(constan_1.PARAM_DECORATOR, params, target.constructor);
    };
};
var classification = function (paramList, name) {
    var map = new Map();
    paramList.forEach(function (sender) {
        var paramName = sender[name];
        var arr = map.get(paramName) || [];
        arr.push(sender);
        map.set(paramName, arr);
    });
    return map;
};
var initProperty = function (map, target) {
    var keyList = Array.from(map.keys());
    var _loop_1 = function (name_1) {
        var senderList = map.get(name_1);
        var sender = senderList.pop();
        var factory = sender.factory, data = sender.data, propertyName = sender.propertyName;
        var instance = null;
        if (delete target.prototype[propertyName]) {
            Object.defineProperty(target.prototype, propertyName, {
                get: function () {
                    instance = instance || typeof data === "undefined"
                        ? (typeof factory === "function" ? factory : function () { })(target, propertyName, sender)
                        : data;
                    return instance;
                },
                enumerable: true,
                configurable: true,
            });
        }
    };
    for (var _i = 0, keyList_1 = keyList; _i < keyList_1.length; _i++) {
        var name_1 = keyList_1[_i];
        _loop_1(name_1);
    }
};
var initMethod = function (map, target) {
    var keyList = Array.from(map.keys());
    var _loop_2 = function (name_2) {
        var senderList = map.get(name_2);
        var senderFunc = target.prototype[name_2];
        var methodList;
        var createMethodList = function () {
            if (methodList) {
                return methodList;
            }
            methodList = [];
            senderList.forEach(function (sender) {
                var factory = sender.factory, data = sender.data, propertyName = sender.propertyName;
                var instance = typeof data === "undefined"
                    ? (typeof factory === "function" ? factory : function () { })(target, propertyName, sender)
                    : data;
                methodList.push(instance);
            });
            return methodList;
        };
        var proxyFunc = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = typeof senderFunc === "function" ? senderFunc.apply(this, args) : undefined;
            return createMethodList().reduce(function (result, func) {
                var nextResult = typeof func === "function" && func(result) || result;
                return nextResult;
            }, result);
        };
        if (delete target.prototype[name_2]) {
            Object.defineProperty(target.prototype, name_2, {
                get: function () { return proxyFunc; },
                enumerable: true,
                configurable: true,
            });
        }
    };
    for (var _i = 0, keyList_2 = keyList; _i < keyList_2.length; _i++) {
        var name_2 = keyList_2[_i];
        _loop_2(name_2);
    }
};
var initParams = function (map, target) {
    var keyList = Array.from(map.keys());
    var _loop_3 = function (name_3) {
        var senderList = map.get(name_3);
        var senderFunc = target.prototype[name_3];
        var paramsMap;
        var craeteParamsMap = function () {
            if (paramsMap) {
                return paramsMap;
            }
            paramsMap = new Map();
            senderList.forEach(function (sender) {
                var paramIndex = sender.paramIndex, methodName = sender.methodName, factory = sender.factory, data = sender.data, type = sender.type;
                var instance = typeof data === "undefined"
                    ? (typeof factory === "function" ? factory : function () { })(target, methodName, paramIndex, type, sender)
                    : data;
                paramsMap.set(paramIndex, instance);
            });
            return paramsMap;
        };
        var proxyFunc = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            craeteParamsMap().forEach(function (arg, index) {
                args[index] = arg;
            });
            return typeof senderFunc === "function" ? senderFunc.apply(this, args) : undefined;
        };
        if (delete target.prototype[name_3]) {
            Object.defineProperty(target.prototype, name_3, {
                get: function () { return proxyFunc; },
                enumerable: true,
                configurable: true,
            });
        }
    };
    for (var _i = 0, keyList_3 = keyList; _i < keyList_3.length; _i++) {
        var name_3 = keyList_3[_i];
        _loop_3(name_3);
    }
};
exports.Injectable = function () {
    return function (target) {
        var constructor = target.prototype.constructor;
        var types = Reflect.getMetadata(constan_1.PARAM_TYPES, constructor);
        Reflect.defineMetadata(constan_1.INJECTABLE_DECORATOR, {
            constructorTypes: types
        }, target);
    };
};
exports.IsInjectable = function (craetor) {
    var injectParams = Reflect.getMetadata(constan_1.INJECTABLE_DECORATOR, craetor);
    return !!(injectParams && Array.isArray(injectParams.constructorTypes));
};
var Factory = (function () {
    function Factory() {
    }
    Factory.replaceValue = function (params) {
        if (Factory.craetorInstanceMap.has(params.provide)) {
            Factory.craetorInstanceMap.set(params.provide, params.useValue);
        }
        return Factory.craetorInstanceMap.get(params.provide);
    };
    Factory.clearValue = function (provide) {
        return Factory.craetorInstanceMap.delete(provide);
    };
    Factory.getValue = function (provide) {
        return Factory.craetorInstanceMap.get(provide);
    };
    Factory.useValue = function (params) {
        var useValue = params.useValue, provide = params.provide;
        if (Factory.craetorInstanceMap.has(provide)) {
            return Factory.craetorInstanceMap.get(provide);
        }
        Factory.craetorInstanceMap.set(provide, useValue);
        return useValue;
    };
    Factory.useClass = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var creator, provide, constructor, injectorTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        creator = params.useClass, provide = params.provide;
                        if (Factory.craetorInstanceMap.has(provide)) {
                            return [2, Factory.craetorInstanceMap.get(provide)];
                        }
                        constructor = creator.prototype.constructor;
                        if (!exports.IsInjectable(creator.prototype.constructor)) {
                            throw new Error("\u8BF7\u5728" + creator.name + "\u5B9A\u4E49\u7684\u65F6\u5019\u52A0\u4E0A @Injectable()");
                        }
                        injectorTypes = Reflect.getMetadata(constan_1.PARAM_TYPES, constructor);
                        return [4, Factory.create(injectorTypes, creator, provide)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Factory.useFactory = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var constructor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        constructor = params.useFactory.prototype && params.useFactory.prototype.constructor || params.useFactory;
                        return [4, Factory.create(params.inject || [], constructor, params.provide)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Factory.create = function (injectors, creator, dirName) {
        return __awaiter(this, void 0, void 0, function () {
            var params, propertyParams, methodParams, instance, constructor, _a, _b, _c, _d, useFactory, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        dirName = dirName || creator;
                        if (Factory.craetorInstanceMap.has(dirName)) {
                            return [2, Factory.craetorInstanceMap.get(dirName)];
                        }
                        params = Reflect.getMetadata(constan_1.PARAM_DECORATOR, creator) || [];
                        initParams(classification(params, "methodName"), creator);
                        propertyParams = Reflect.getMetadata(constan_1.PROPERTY_DECORATOR, creator) || [];
                        initProperty(classification(propertyParams, "propertyName"), creator);
                        methodParams = Reflect.getMetadata(constan_1.METHOD_DECORATOR, creator) || [];
                        initMethod(classification(methodParams, "propertyName"), creator);
                        if (!(creator.prototype && creator.prototype.constructor == creator)) return [3, 2];
                        constructor = creator;
                        _b = (_a = constructor.bind).apply;
                        _c = [constructor];
                        _d = [[void 0]];
                        return [4, Promise.all(injectors.map(function (type) { return Factory.createConstructor(type); }))];
                    case 1:
                        instance = new (_b.apply(_a, _c.concat([__spreadArrays.apply(void 0, _d.concat([_h.sent()]))])))();
                        return [3, 5];
                    case 2:
                        useFactory = creator;
                        _f = (_e = useFactory).apply;
                        _g = [void 0];
                        return [4, Promise.all(injectors.map(function (type) { return Factory.createConstructor(type); }))];
                    case 3: return [4, _f.apply(_e, _g.concat([_h.sent()]))];
                    case 4:
                        instance = _h.sent();
                        _h.label = 5;
                    case 5:
                        Factory.craetorInstanceMap.set(dirName, instance);
                        return [2, instance];
                }
            });
        });
    };
    Factory.createConstructor = function (creator) {
        return __awaiter(this, void 0, void 0, function () {
            var constructor, injectorTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (Factory.craetorInstanceMap.has(creator)) {
                            return [2, Factory.craetorInstanceMap.get(creator)];
                        }
                        constructor = creator.prototype.constructor;
                        if (!exports.IsInjectable(creator.prototype.constructor)) {
                            throw new Error("\u8BF7\u5728" + creator.name + "\u5B9A\u4E49\u7684\u65F6\u5019\u52A0\u4E0A @Injectable()");
                        }
                        injectorTypes = Reflect.getMetadata(constan_1.PARAM_TYPES, constructor);
                        return [4, Factory.create(injectorTypes, creator, creator)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Factory.craetorInstanceMap = new Map();
    return Factory;
}());
exports.Factory = Factory;
//# sourceMappingURL=injectable.js.map