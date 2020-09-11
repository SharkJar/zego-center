"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceBase = void 0;
var BalanceBase = (function () {
    function BalanceBase(addressList, defaultWeight) {
        if (defaultWeight === void 0) { defaultWeight = 100; }
        this.addressList = addressList;
        this.defaultWeight = defaultWeight;
        this.weightAddress = new Map();
        this.updateAddressList(addressList, defaultWeight);
    }
    Object.defineProperty(BalanceBase.prototype, "addressWeightList", {
        get: function () {
            return this.shuffleWeightAddressList || [];
        },
        enumerable: false,
        configurable: true
    });
    BalanceBase.prototype.parseAddressList = function (addressList, defaultWeight) {
        if (defaultWeight === void 0) { defaultWeight = this.defaultWeight; }
        if (!Array.isArray(addressList) || addressList.length <= 0) {
            throw new Error('[balanceBase-parseAddressList] 参数错误-addressList');
        }
        var addressMap = new Map();
        addressList.forEach(function (adr) {
            if (!!!adr) {
                return;
            }
            var address = typeof adr === 'string' ? adr : adr.address;
            var weight = isNaN(adr.weight) ? defaultWeight : adr.weight;
            addressMap.set(address, { address: address, weight: weight });
        });
        return addressMap;
    };
    BalanceBase.prototype.shuffleList = function (list) {
        var _a;
        var length = list.length;
        var randomNum;
        while (length > 0) {
            randomNum = (Math.random() * length--) >>> 0;
            _a = [list[randomNum], list[length]], list[length] = _a[0], list[randomNum] = _a[1];
        }
        return list;
    };
    BalanceBase.prototype.getAddress = function () {
        throw new Error('[balanceBase-getAddress] 请调用实现类');
    };
    BalanceBase.prototype.getAddressWeight = function (address) {
        var sender = this.weightAddress.get(address);
        return (typeof sender !== 'undefined' && sender.weight) || 0;
    };
    BalanceBase.prototype.updateAddressList = function (addressList, defaultWeight) {
        if (defaultWeight === void 0) { defaultWeight = this.defaultWeight; }
        if (!Array.isArray(addressList)) {
            return new Map();
        }
        this.weightAddress = this.parseAddressList(addressList, defaultWeight);
        var list = Array.from(this.weightAddress.values());
        this.shuffleWeightAddressList = list.length > 1 ? this.shuffleList(list) : list;
        return this.weightAddress;
    };
    return BalanceBase;
}());
exports.BalanceBase = BalanceBase;
//# sourceMappingURL=balance.base.js.map