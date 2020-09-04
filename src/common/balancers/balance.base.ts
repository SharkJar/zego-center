/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-21 18:15:00
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-09-02 15:51:52
 */
import { balancers, addressListType, addressSender } from './balance.manage.interface';

type addressWeightMap = Map<string, addressSender>;
export class BalanceBase implements balancers {
  protected weightAddress: addressWeightMap = new Map<string, addressSender>();
  protected shuffleWeightAddressList!: addressSender[];
  constructor(private addressList: addressListType, private defaultWeight: number = 100) {
    this.updateAddressList(addressList, defaultWeight);
  }

  /**
   * 返回地址数组
   */
  protected get addressWeightList(): addressSender[] {
    return this.shuffleWeightAddressList || [];
  }

  /**
   * 把string[] | Array<{ address:string,weight:number }>的格式统一
   * @param addressList
   * @param defaultWeight
   */
  protected parseAddressList(
    addressList: addressListType,
    defaultWeight: number = this.defaultWeight,
  ): addressWeightMap {
    if (!Array.isArray(addressList) || addressList.length <= 0) {
      throw new Error('[balanceBase-parseAddressList] 参数错误-addressList');
    }
    const addressMap: addressWeightMap = new Map<string, addressSender>();
    addressList.forEach((adr: any) => {
      //空字符串情况等
      if (!!!adr) {
        return;
      }
      const address = typeof adr === 'string' ? adr : adr.address;
      const weight = isNaN(adr.weight) ? defaultWeight : adr.weight;
      addressMap.set(address, { address, weight });
    });
    return addressMap;
  }

  /**
   * 数组乱序
   * @param list
   */
  protected shuffleList<T = any>(list: T[]): T[] {
    let length = list.length;
    let randomNum;
    while (length > 0) {
      randomNum = (Math.random() * length--) >>> 0;
      [list[length], list[randomNum]] = [list[randomNum], list[length]];
    }
    return list;
  }

  /**
   * 计算获取地址
   */
  getAddress(): string {
    throw new Error('[balanceBase-getAddress] 请调用实现类');
  }
  /**
   * 根据地址获取地址的权重
   */
  getAddressWeight(address: string): number {
    const sender: addressSender | void = this.weightAddress.get(address);
    return (typeof sender !== 'undefined' && sender.weight) || 0;
  }
  /**
   * 更新服务地址
   * @param addressList
   * @param defaultWeight
   */
  updateAddressList(addressList: addressListType, defaultWeight: number = this.defaultWeight): addressWeightMap {
    if (!Array.isArray(addressList)) {
      return new Map();
    }
    this.weightAddress = this.parseAddressList(addressList, defaultWeight);
    const list = Array.from(this.weightAddress.values());
    this.shuffleWeightAddressList = list.length > 1 ? this.shuffleList(list) : list;
    return this.weightAddress;
  }
}
