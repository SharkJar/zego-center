"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpuMetrics = void 0;
var os = require("os");
var instantaneousCpuTime = function () {
    var cpus = os.cpus();
    var _a = cpus.reduce(function (_a, cpu) {
        var idle = _a[0], tick = _a[1];
        idle += cpu.times.idle;
        tick = Object.values(cpu.times).reduce(function (tick, time) { return tick + time; }, tick);
        return [idle, tick];
    }, [0, 0]), idle = _a[0], tick = _a[1];
    return { idle: idle / cpus.length, tick: tick / cpus.length };
};
exports.CpuMetrics = function (cputime) {
    if (cputime === void 0) { cputime = 1000; }
    var _a = instantaneousCpuTime(), startIdle = _a.idle, startTick = _a.tick;
    var resolve;
    setTimeout(function () {
        var _a = instantaneousCpuTime(), endIdle = _a.idle, endTick = _a.tick;
        resolve(1 - (endIdle - startIdle) / (endTick - startTick));
    }, cputime);
    return new Promise(function (res) { return (resolve = res); });
};
//# sourceMappingURL=cpu.js.map