/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-21 18:14:52
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-08-26 14:30:40
 */
import * as crypto from 'crypto';
import { BalanceBase } from './balance.base';
import { balancers, addressListType, addressSender } from './balance.manage.interface';

export class ConsistentHash extends BalanceBase implements balancers {
  private virtualAddress!: Map<number, addressSender>;
  private oderKeys!: number[];

  /**
   * 更新
   * @param addressList
   * @param defaultWeight
   */
  updateAddressList(addressList: addressListType, defaultWeight?: number): Map<string, addressSender> {
    const addressMap = super.updateAddressList(addressList, defaultWeight);
    const adrMd5Hex = Array.from({ length: 128 / 4 });
    const adrHex = Array.from({ length: 4 });
    this.virtualAddress = new Map<number, addressSender>();
    //计算虚拟address
    this.addressWeightList.map((adrSender) => {
      const { address } = adrSender;
      adrMd5Hex.map((md5Hex) => {
        //计算md5
        const digest = this.md5(`${address}${md5Hex}`);
        adrHex.map((hex) => {
          //计算hash 同时存储起来
          this.virtualAddress.set(this.getHash(digest, Number(hex)), adrSender);
        });
      });
    });
    //排序
    this.oderKeys = Array.from(this.virtualAddress.keys()).sort((prev, current) => prev - current);
    //返回结果
    return addressMap;
  }

  /**
   * 把md5的byte字符串 转换成int
   * @param digest
   * @param idx
   */
  private getHash(digest: string, idx: number): number {
    const length = 4;
    if (!digest || digest.length < 3 + idx * length) {
      throw new Error('[ConsistentHash-getHash] 参数错误-digest');
    }
    //计算
    const idxNumbers: number[] = Array.from(
      { length },
      (empty, num) => Number(digest[num + idx * 4]) & (0xff << (num * 8)),
    );
    //返回hash
    return idxNumbers.reduce((prevNum, nextNum) => prevNum | nextNum) & 0xffffffff;
  }

  /**
   * 根据key的md5 找到对应的address
   * @param hash
   */
  private lookForKey(hash: number): addressSender {
    const length = this.oderKeys.length - 1;
    let key = this.oderKeys[0];

    //如果hash值大于oderKeys的长度了 那么需要重新定位一个hash
    //先创建一个oderKeys长度自增的数组Object.keys(Array.from({ length })) = ["0","1","2","3","4",...]
    //在通过反转["4","3","2","1","0"] 在查找一个小于hash的值 直接返回
    this.oderKeys[length] < hash &&
      Object.keys(Array.from({ length }))
        .reverse()
        .find((currentNum) => {
          const isFind = this.oderKeys[Number(currentNum)] < hash;
          key = this.oderKeys[Number(currentNum) + 1];
          return isFind;
        });

    return this.virtualAddress.get(key) as addressSender;
  }

  /**
   * 转换md5
   * @param sender
   */
  private md5(sender: string | Object): string {
    sender = typeof sender === 'string' ? sender : JSON.stringify(sender);
    return crypto.createHash('md5').update(String(sender), 'utf8').digest('hex').toString();
  }

  /**
   * hash一致性 获取address
   * @param args
   */
  getAddress(args?: any): string {
    const key = String(typeof args !== 'string' ? JSON.stringify(args) : args) || '';
    const hash = this.getHash(this.md5(key), 0);
    const sender = this.lookForKey(hash);
    return sender.address;
  }
}
