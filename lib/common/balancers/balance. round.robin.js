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
exports.RoundRobin = void 0;
var balance_base_1 = require("./balance.base");
var RoundRobin = (function (_super) {
    __extends(RoundRobin, _super);
    function RoundRobin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RoundRobin.prototype.updateAddressList = function (addressList, defaultWeight) {
        var addressMap = _super.prototype.updateAddressList.call(this, addressList, defaultWeight);
        this.currentIndex = -1;
        return addressMap;
    };
    RoundRobin.prototype.getAddress = function () {
        var addressList = this.addressWeightList;
        var sender = addressList[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % addressList.length;
        return sender.address;
    };
    return RoundRobin;
}(balance_base_1.BalanceBase));
exports.RoundRobin = RoundRobin;
//# sourceMappingURL=balance. round.robin.js.map