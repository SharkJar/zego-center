import { BalanceBase } from './balance.base';
import { balancers, addressListType, addressSender } from './balance.manage.interface';
export declare class ConsistentHash extends BalanceBase implements balancers {
    private virtualAddress;
    private oderKeys;
    updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender>;
    private getHash;
    private lookForKey;
    private md5;
    getAddress(args?: any): string;
}
