import { BalanceBase } from './balance.base';
import { balancers, addressSender, addressListType } from './balance.manage.interface';
export declare class WeightRandom extends BalanceBase implements balancers {
    private totalWeight;
    private isWeightSame;
    updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender>;
    getAddress(): string;
}
