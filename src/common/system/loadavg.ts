import * as os from 'os';

//获取cpu内核数
const cpuLenth = os.cpus().length;

/**
 * 计算loadavg
 * 1分钟的指标是很难得到较为均衡的指标的。因为1分钟时间太短，可能某一秒的峰值就能够影响到1分钟时间段内的平均指标。但是，1分钟内，如果loadavg突然达到很高的值，也可能是系统崩溃的前兆，也是需要警惕的一个指标。
 * 而5分钟和15分钟则是较为合适的评判指标。当CPU在5分钟或者15分钟内都保持高负荷运作，对于整个系统是非常危险的.
 */
export const GetLoadavg = function () {
  //返回一个数组，包含 1、5 和 15 分钟的平均负载。
  //平均负载是系统活动性的测量，由操作系统计算得出，并表现为一个分数。
  //平均负载是 UNIX 特定的概念。 在 Windows 上，其返回值始终为 [0, 0, 0]。
  const avg = os.loadavg();
  //单核CPU的平均负载
  //如果5、15分钟负载一直很高 就要注意报警
  return avg.map((load) => load / cpuLenth);
};
