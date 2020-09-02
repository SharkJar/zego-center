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
exports.ConsistentHash = void 0;
var crypto = require("crypto");
var balance_base_1 = require("./balance.base");
var ConsistentHash = (function (_super) {
    __extends(ConsistentHash, _super);
    function ConsistentHash() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConsistentHash.prototype.updateAddressList = function (addressList, defaultWeight) {
        var _this = this;
        var addressMap = _super.prototype.updateAddressList.call(this, addressList, defaultWeight);
        var adrMd5Hex = Array.from({ length: 128 / 4 });
        var adrHex = Array.from({ length: 4 });
        this.virtualAddress = new Map();
        this.addressWeightList.map(function (adrSender) {
            var address = adrSender.address;
            adrMd5Hex.map(function (md5Hex) {
                var digest = _this.md5("" + address + md5Hex);
                adrHex.map(function (hex) {
                    _this.virtualAddress.set(_this.getHash(digest, Number(hex)), adrSender);
                });
            });
        });
        this.oderKeys = Array.from(this.virtualAddress.keys()).sort(function (prev, current) { return prev - current; });
        return addressMap;
    };
    ConsistentHash.prototype.getHash = function (digest, idx) {
        var length = 4;
        if (!digest || digest.length < 3 + idx * length) {
            throw new Error("[ConsistentHash-getHash] 参数错误-digest");
        }
        var idxNumbers = Array.from({ length: length }, function (empty, num) { return Number(digest[num + idx * 4]) & 0xff << num * 8; });
        return idxNumbers.reduce(function (prevNum, nextNum) { return prevNum | nextNum; }) & 0xffffffff;
    };
    ConsistentHash.prototype.lookForKey = function (hash) {
        var _this = this;
        var length = this.oderKeys.length - 1;
        var key = this.oderKeys[0];
        this.oderKeys[length] < hash && Object.keys(Array.from({ length: length })).reverse().find(function (currentNum) {
            var isFind = _this.oderKeys[Number(currentNum)] < hash;
            key = _this.oderKeys[Number(currentNum) + 1];
            return isFind;
        });
        return this.virtualAddress.get(key);
    };
    ConsistentHash.prototype.md5 = function (sender) {
        sender = typeof sender === "string" ? sender : JSON.stringify(sender);
        return crypto.createHash("md5").update(String(sender), "utf8").digest("hex").toString();
    };
    ConsistentHash.prototype.getAddress = function (args) {
        var key = String(typeof args !== "string" ? JSON.stringify(args) : args) || "";
        var hash = this.getHash(this.md5(key), 0);
        var sender = this.lookForKey(hash);
        return sender.address;
    };
    return ConsistentHash;
}(balance_base_1.BalanceBase));
exports.ConsistentHash = ConsistentHash;
//# sourceMappingURL=balance.consistent.hash.js.map