/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-21 22:08:53
 * @Last Modified by:   Johnny.xushaojia
 * @Last Modified time: 2020-08-21 22:08:53
 */
import { BalanceBase } from './balance.base';
import { balancers } from './balance.manage.interface';

export class Random extends BalanceBase implements balancers {
  /**
   * 随机获取服务地址
   */
  getAddress(): string {
    const addressList = this.addressWeightList;
    const index = Math.floor(Math.random() * (addressList.length - 1));
    return addressList[index].address;
  }
}
