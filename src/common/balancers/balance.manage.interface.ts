/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-21 18:14:56
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-09-02 12:12:33
 */
export interface balancers {
  //获取接口地址
  getAddress(): string;
  //获取当前地址的权重
  getAddressWeight(address: string): number;
  //更新服务地址
  updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender>;
}

export type addressSender = { address: string; weight: number };
export type addressListType = Array<addressSender> | string[];
