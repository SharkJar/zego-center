/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-29 14:20:55
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-09-11 12:04:40
 */
import fastSafeStringify from 'fast-safe-stringify';
import { CreateMode } from 'node-zookeeper-client';
import { ZkHelper, ACLS } from '../common/zookeeper/zk.helper';
import { Injectable } from 'zego-injector';
import { ConfigService } from 'zego-config';
import { GetSystemWeight } from '../common/system/system.weight';
import * as Path from 'path';
import { BusinessLogger } from '../common/logger/logger';

type registerConfig = {
  //属于哪个系统
  systemName: string;
  //属于哪个服务
  serviceName: string;
  //当前服务的IP
  serverIP: string;
  //当前服务的端口
  serverPort: number;
  //当前节点的权重
  weight?: number;
};

@Injectable()
export class CenterService {
  //用于定时和zookeeper同步数据
  private liveHeadTask: Map<string, any> = new Map();
  private nextHandler!: NodeJS.Timeout;
  private isStartNextTick: boolean = true;

  constructor(private helper: ZkHelper, private config: ConfigService, private logger: BusinessLogger) {
    this.nextTick();
  }

  public stopNextTick() {
    this.isStartNextTick = false;
  }

  public startNextTick() {
    this.isStartNextTick = true;
  }

  public isNeedBreakZK(cpu: number, avg5: number, avg15: number, heap: number) {
    return this.isBreakZk(cpu, avg5, avg15, heap);
  }

  /**
   * 根据负载情况 返回是否断开zk连接
   */
  private isBreakZk(cpu: number, avg5: number, avg15: number, heap: number) {
    //cpu大于等于0.8
    //avg5和avg15大于等于0.85
    //heap大于等于0.85
    return cpu >= 0.8 || avg5 > 0.85 || avg15 > 0.85; //|| heap > 0.85;
  }
  /**
   * 定时任务 20s 一次
   */
  private async nextTick(polling: number = 3 * 60 * 1000) {
    this.nextHandler && clearTimeout(this.nextHandler);
    const tasks = Array.from(this.liveHeadTask.values());
    //等待下一次循环
    this.nextHandler = setTimeout(this.nextTick.bind(this, polling), polling);
    if (tasks.length >= 0 && this.isStartNextTick) {
      //获取服务器的最新权重
      const { weight, cpu, avg5, avg15, heap } = await GetSystemWeight();

      //写入日志
      this.logger.log(
        `[CenterService-isBreakZk] \r\n 当前服务器情况:cpu使用率:${cpu},avg5:${avg5},avg15:${avg15},node内存使用率:${heap}`,
      );
      //判断是否需要断开zk
      const isNeedBreak = this.isNeedBreakZK(cpu, avg5, avg15, heap);
      //断开zk 当前注册节点会跟着一起删除
      if (isNeedBreak) {
        return await this.helper.close();
      }
      //日志
      this.logger.log(
        `[CenterService-nextTick] \r\n 当前调用注册中心的task:${JSON.stringify(tasks)},当前的weight:${weight}`,
      );
      let currentTask;
      //无需断开的时候 继续保持注册状态
      while ((currentTask = tasks.shift())) {
        try {
          //确保节点还存在中
          const path = await this.registerZK({ ...currentTask, weight });
          //写入节点数据
          await this.helper.setData(
            String(path),
            JSON.stringify({ ip: currentTask.serverIP, port: currentTask.serverPort, weight }),
          );
        } catch (error) {}
      }
    }
  }

  /**
   * 注册服务 同时启动心跳
   * @param params
   */
  public async register(params: registerConfig) {
    params.weight = params.weight || (await GetSystemWeight()).weight;
    const registerPath = await this.registerZK(params);
    this.liveHeadTask.set(fastSafeStringify(params), params);
    return registerPath;
  }

  /**
   * 取消注册 同时取消心跳
   * @param params
   */
  public async unregister(params: registerConfig) {
    const del = await this.unRegisterZK(params);
    this.liveHeadTask.delete(fastSafeStringify(params));
    return del;
  }

  /**
   * 检查节点是否已经存在  如果已经存在什么也不做
   * 如果不存在 创建节点同时写入数据
   * @param systemName
   * @param serviceName
   * @param serverIP
   * @param serverPort
   * @param weight
   */
  private async registerZK(params: registerConfig) {
    const { systemName, serviceName, serverIP, serverPort, weight } = params;
    const serverPath = Path.join(systemName, serviceName);
    const path = Path.join(serverPath, `${serverIP}:${serverPort}`);
    const data = { ip: serverIP, port: serverPort, weight };
    //先创建服务节点 如果节点已经存在 则忽略
    await this.helper.mkdirp(serverPath);
    //创建服务临时节点
    //当断线或者session过期 临时节点都会被删除
    return await this.helper.mkdirp(path, JSON.stringify(data), ACLS.OPEN_ACL_UNSAFE, CreateMode.EPHEMERAL);
  }

  /**
   * 删除当前节点
   * @param systemName
   * @param serviceName
   * @param serverIP
   * @param serverPort
   */
  private async unRegisterZK(params: Omit<registerConfig, 'weight'>) {
    const { systemName, serviceName, serverIP, serverPort } = params;
    const serverPath = Path.join(systemName, serviceName);
    const path = Path.join(serverPath, `${serverIP}:${serverPort}`);
    //删除节点
    return await this.helper.remove(path);
  }
}
