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
exports.WeightRandom = void 0;
var balance_base_1 = require("./balance.base");
var WeightRandom = (function (_super) {
    __extends(WeightRandom, _super);
    function WeightRandom() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WeightRandom.prototype.updateAddressList = function (addressList, defaultWeight) {
        var addressMap = _super.prototype.updateAddressList.call(this, addressList, defaultWeight);
        this.totalWeight = 0;
        this.isWeightSame = true;
        var prevSender = null;
        for (var _i = 0, _a = this.addressWeightList; _i < _a.length; _i++) {
            var currentSender = _a[_i];
            this.totalWeight += currentSender.weight;
            if (prevSender) {
                this.isWeightSame = this.isWeightSame && prevSender.weight == currentSender.weight;
            }
            prevSender = currentSender;
        }
        return addressMap;
    };
    WeightRandom.prototype.getAddress = function () {
        var addressList = this.addressWeightList;
        if (this.totalWeight <= 0 && this.isWeightSame) {
            var index = Math.floor(Math.random() * (addressList.length - 1));
            return addressList[index].address;
        }
        var randomWeight = Math.floor(Math.random() * this.totalWeight);
        var sender = addressList.find(function (addressSender) { return (randomWeight -= addressSender.weight) < 0; });
        return sender.address;
    };
    return WeightRandom;
}(balance_base_1.BalanceBase));
exports.WeightRandom = WeightRandom;
//# sourceMappingURL=balance.weight.random.js.map