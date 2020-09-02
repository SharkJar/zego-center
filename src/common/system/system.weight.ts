import { CpuMetrics } from './cpu'
import { GetLoadavg } from './loadavg'
import { GetMemory } from './memory'

/**
 * 获得服务器权重
 */
export const GetSystemWeight = async () => {
    const cpu = await CpuMetrics() as number
    const { sys,heap,node } = GetMemory()
    const [avg1,avg5,avg15] = GetLoadavg()
    //计算一个权重
    //cpu 按照 90计算
    //heap 按照 100计算
    //avg5 + avg15 按照 80计算
    return {
        weight:Math.floor((1 - heap) * 1 * 100 + (2 - avg5 - avg15) * 0.8 * 100 + (1 - cpu) * 0.9 * 100),
        //cpu占用率
        cpu,
        //内存占用率
        heap,
        //cpu 5分钟负载
        avg5,
        //cpu 15分钟负载
        avg15
    }
}

