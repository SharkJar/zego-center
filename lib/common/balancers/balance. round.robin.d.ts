import { BalanceBase } from './balance.base';
import { balancers, addressListType, addressSender } from './balance.manage.interface';
export declare class RoundRobin extends BalanceBase implements balancers {
    private currentIndex;
    updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender>;
    getAddress(): string;
}
