/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-21 22:08:48
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-08-26 14:35:49
 */
import { BalanceBase } from './balance.base';
import { balancers, addressSender, addressListType } from './balance.manage.interface';

export class WeightRandom extends BalanceBase implements balancers {
  private totalWeight!: number;
  private isWeightSame!: boolean;

  /**
   * 更新服务列表
   * @param addressList
   * @param defaultWeight
   */
  updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender> {
    const addressMap = super.updateAddressList(addressList, defaultWeight);
    //初始化
    this.totalWeight = 0;
    this.isWeightSame = true;
    let prevSender = null;
    for (let currentSender of this.addressWeightList) {
      this.totalWeight += currentSender.weight;
      if (prevSender) {
        this.isWeightSame = this.isWeightSame && prevSender.weight == currentSender.weight;
      }
      prevSender = currentSender;
    }
    return addressMap;
  }

  /**
   * 随机获取服务地址
   */
  getAddress(): string {
    const addressList = this.addressWeightList;
    if (this.totalWeight <= 0 && this.isWeightSame) {
      const index = Math.floor(Math.random() * (addressList.length - 1));
      return addressList[index].address;
    }

    let randomWeight = Math.floor(Math.random() * this.totalWeight);
    const sender: any = addressList.find((addressSender) => (randomWeight -= addressSender.weight) < 0);

    return sender.address;
  }
}
