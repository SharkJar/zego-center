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
exports.WeightRoundRobin = void 0;
var balance_base_1 = require("./balance.base");
var WeightRoundRobin = (function (_super) {
    __extends(WeightRoundRobin, _super);
    function WeightRoundRobin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WeightRoundRobin.prototype.updateAddressList = function (addressList, defaultWeight) {
        var addressMap = _super.prototype.updateAddressList.call(this, addressList, defaultWeight);
        this.currentIndex = -1;
        this.currentWeight = this.maxWeight = 0;
        var weightList = [];
        this.isWeightSame = true;
        var prevSender;
        for (var _i = 0, _a = this.addressWeightList; _i < _a.length; _i++) {
            var currentSender = _a[_i];
            weightList.push(this.maxWeight = currentSender.weight);
            if (prevSender) {
                this.maxWeight = Math.max(prevSender.weight, currentSender.weight);
                this.isWeightSame = this.isWeightSame && prevSender.weight == currentSender.weight;
            }
            prevSender = currentSender;
        }
        this.gcdWeight = this.gcdMath(weightList);
        return addressMap;
    };
    WeightRoundRobin.prototype.gcdMath = function (weightList) {
        var _this = this;
        return weightList.reduce(function (prevNum, currentNum) { return !currentNum ? prevNum : _this.gcdMath([currentNum, prevNum % currentNum]); });
    };
    WeightRoundRobin.prototype.getAddress = function () {
        var addressList = this.addressWeightList;
        this.currentIndex = (this.currentIndex + 1) % addressList.length;
        var sender = addressList[this.currentIndex];
        if (this.isWeightSame) {
            return sender.address;
        }
        if (this.maxWeight <= 0) {
            throw new Error("[WeightRoundRobin-getAddress] empty address");
        }
        do {
            if (this.currentIndex == 0) {
                this.currentWeight -= this.gcdWeight;
                this.currentWeight = this.currentWeight <= 0 ? this.maxWeight : this.currentWeight;
            }
            if (sender.weight >= this.currentWeight) {
                return sender.address;
            }
            this.currentIndex = (this.currentIndex + 1) % addressList.length;
            sender = addressList[this.currentIndex];
        } while (true);
    };
    return WeightRoundRobin;
}(balance_base_1.BalanceBase));
exports.WeightRoundRobin = WeightRoundRobin;
//# sourceMappingURL=balance.weight.round.robin.js.map