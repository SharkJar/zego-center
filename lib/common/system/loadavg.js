"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLoadavg = void 0;
var os = require("os");
var cpuLenth = os.cpus().length;
exports.GetLoadavg = function () {
    var avg = os.loadavg();
    return avg.map(function (load) { return load / cpuLenth; });
};
//# sourceMappingURL=loadavg.js.map