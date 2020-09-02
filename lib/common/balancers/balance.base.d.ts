import { balancers, addressListType, addressSender } from './balance.manage.interface';
declare type addressWeightMap = Map<string, addressSender>;
export declare class BalanceBase implements balancers {
    private addressList;
    private defaultWeight;
    protected weightAddress: addressWeightMap;
    protected shuffleWeightAddressList: addressSender[];
    constructor(addressList: addressListType, defaultWeight?: number);
    protected get addressWeightList(): addressSender[];
    protected parseAddressList(addressList: addressListType, defaultWeight?: number): addressWeightMap;
    protected shuffleList<T = any>(list: T[]): T[];
    getAddress(): string;
    getAddressWeight(address: string): number;
    updateAddressList(addressList: addressListType, defaultWeight?: number): addressWeightMap;
}
export {};
