export interface balancers {
    getAddress(): string;
    getAddressWeight(address: string): number;
    updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender>;
}
export declare type addressSender = {
    address: string;
    weight: number;
};
export declare type addressListType = Array<addressSender> | string[];
