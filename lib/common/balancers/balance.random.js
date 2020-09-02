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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Random = void 0;
var balance_base_1 = require("./balance.base");
var Random = (function (_super) {
    __extends(Random, _super);
    function Random() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Random.prototype.getAddress = function () {
        var addressList = this.addressWeightList;
        var index = Math.floor(Math.random() * (addressList.length - 1));
        return addressList[index].address;
    };
    return Random;
}(balance_base_1.BalanceBase));
exports.Random = Random;
//# sourceMappingURL=balance.random.js.map