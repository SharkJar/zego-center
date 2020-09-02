/*
 * @Author: Johnny.xushaojia 
 * @Date: 2020-08-21 22:08:44 
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-09-02 15:52:22
 */
import { BalanceBase } from './balance.base'
import { balancers, addressListType, addressSender } from './balance.manage.interface'

export class WeightRoundRobin extends BalanceBase implements balancers{
    private currentIndex!:number
    private currentWeight!:number
    private gcdWeight!:number
    private maxWeight!:number
    private isWeightSame!:boolean

    /**
     * 更新服务列表
     * @param addressList 
     * @param defaultWeight 
     */
    updateAddressList(addressList:addressListType,defaultWeight?:number):Map<string,addressSender>{
        const addressMap = super.updateAddressList(addressList,defaultWeight)
        //重置
        this.currentIndex = -1
        this.currentWeight = this.maxWeight = 0
        const weightList: number[] = []
        this.isWeightSame = true
        let prevSender

        for(let currentSender of this.addressWeightList){
            weightList.push(this.maxWeight = currentSender.weight)
            if(prevSender){
                this.maxWeight = Math.max(prevSender.weight,currentSender.weight)
                this.isWeightSame = this.isWeightSame && prevSender.weight == currentSender.weight
            }
            prevSender = currentSender
        }
        this.gcdWeight = this.gcdMath(weightList)

        return addressMap
    }

    /**
     * 不固定权重 计算
     * @param weightList 
     */
    private gcdMath(weightList:number[]):number{
        return weightList.reduce((prevNum,currentNum) => !currentNum? prevNum : this.gcdMath([currentNum,prevNum % currentNum]))
    }

    /**
     * 随机获取服务地址
     */
    getAddress():string{
        const addressList = this.addressWeightList
        //拿到下一个位置
        this.currentIndex = (this.currentIndex + 1) % addressList.length
        let sender = addressList[this.currentIndex]
        if(this.isWeightSame){ return sender.address }
        //说明没有列表
        if(this.maxWeight <= 0){ throw new Error("[WeightRoundRobin-getAddress] empty address") }
        do{
            if(this.currentIndex == 0){
                this.currentWeight -= this.gcdWeight
                this.currentWeight = this.currentWeight <= 0? this.maxWeight : this.currentWeight
            }
            if(sender.weight >= this.currentWeight){ return sender.address }
            //拿到下一个位置
            this.currentIndex = (this.currentIndex + 1) % addressList.length
            sender = addressList[this.currentIndex]
        }while(true)
    }
}