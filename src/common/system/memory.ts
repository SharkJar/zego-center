import * as os from 'os'

/**
 * 获取内存健康情况
 * 70% ~ 80%的内存占用就是非常危险的情况了。
 * Node的分代式GC算法会在一定程度上浪费部分内存资源，所以当heapUsed达到heapTotal一半的时候，就可以强制触发GC操作了global.gc()
 */
export const GetMemory = () => {
    // 获取当前Node内存堆栈情况
    // rss：表示node进程占用的内存总量
    // heapTotal：表示堆内存的总量。
    // heapUsed：实际堆内存的使用量。
    // external：外部程序的内存使用量，包含Node核心的C++程序的内存使用量。
    const { rss, heapUsed, heapTotal } = process.memoryUsage()
    // 获取系统空闲内存
    const sysFree = os.freemem()
    // 获取系统总内存
    const sysTotal = os.totalmem()

    return {
        sys: 1 - sysFree / sysTotal,  // 系统内存占用率
        heap: heapUsed / heapTotal,   // Node堆内存占用率
        node: rss / sysTotal,         // Node占用系统内存的比例
    }
}