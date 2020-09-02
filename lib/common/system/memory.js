"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMemory = void 0;
var os = require("os");
exports.GetMemory = function () {
    var _a = process.memoryUsage(), rss = _a.rss, heapUsed = _a.heapUsed, heapTotal = _a.heapTotal;
    var sysFree = os.freemem();
    var sysTotal = os.totalmem();
    return {
        sys: 1 - sysFree / sysTotal,
        heap: heapUsed / heapTotal,
        node: rss / sysTotal,
    };
};
//# sourceMappingURL=memory.js.map