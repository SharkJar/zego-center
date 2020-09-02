import * as os from 'os'
import { CpuInfo } from 'os'

const instantaneousCpuTime = () => {
    const cpus:CpuInfo[] = os.cpus()
    //计算总空闲时间以及cpu总时间
    const [idle,tick] = cpus.reduce(([idle,tick],cpu) => {
        //空闲时间相加
        idle += cpu.times.idle
        //cpu时间
        tick = Object.values(cpu.times).reduce((tick,time) => tick + time,tick)
        //返回
        return [idle,tick]
    },[0,0])
    //返回
    return { idle:idle / cpus.length,tick:tick / cpus.length }
}

/**
 * 计算瞬时cpu率 按照单位1s
 */
export const CpuMetrics = (cputime:number = 1000) => {
    const { idle:startIdle,tick:startTick } = instantaneousCpuTime()
    let resolve:Function
    setTimeout(() => {
        const { idle:endIdle,tick:endTick } = instantaneousCpuTime()
        //计算瞬时cpu率
        resolve(1 - (endIdle - startIdle) / (endTick - startTick))
    }, cputime)
    return new Promise(res => (resolve = res))
}