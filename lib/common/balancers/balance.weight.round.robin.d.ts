import { BalanceBase } from './balance.base';
import { balancers, addressListType, addressSender } from './balance.manage.interface';
export declare class WeightRoundRobin extends BalanceBase implements balancers {
    private currentIndex;
    private currentWeight;
    private gcdWeight;
    private maxWeight;
    private isWeightSame;
    updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender>;
    private gcdMath;
    getAddress(): string;
}
