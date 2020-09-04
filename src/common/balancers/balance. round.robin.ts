/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-21 22:09:02
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-08-26 14:25:29
 */
import { BalanceBase } from './balance.base';
import { balancers, addressListType, addressSender } from './balance.manage.interface';

export class RoundRobin extends BalanceBase implements balancers {
  private currentIndex!: number;

  /**
   * 更新服务列表
   * @param addressList
   * @param defaultWeight
   */
  updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender> {
    const addressMap = super.updateAddressList(addressList, defaultWeight);
    //重置
    this.currentIndex = -1;
    return addressMap;
  }

  /**
   * 随机获取服务地址
   */
  getAddress(): string {
    const addressList = this.addressWeightList;
    const sender = addressList[this.currentIndex];
    //拿到下一个位置
    this.currentIndex = (this.currentIndex + 1) % addressList.length;
    return sender.address;
  }
}
