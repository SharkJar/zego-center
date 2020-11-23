/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-29 14:20:55
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-11-03 17:11:00
 */
import fastSafeStringify from 'fast-safe-stringify';
import { CreateMode } from 'node-zookeeper-client';
import { ZkHelper, ACLS } from '../common/zookeeper/zk.helper';
import { Injectable } from 'zego-injector';
import { ConfigService } from 'zego-config';
import { GetSystemWeight } from '../common/system/system.weight';
import * as Path from 'path';
import { BusinessLogger } from '../common/logger/logger';
import { interval, Subject, from, of, timer } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';

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
  // 用于定时和zookeeper同步数据
  private liveHeadTask: Map<string, any> = new Map();
  // 用于记录当前服务器状况
  private systemWeiget!: { weight: number; cpu: number; avg5: number; avg15: number; heap: number };
  // 用于记录是否需要关闭zookeeper的连接
  private systemState: boolean = false;

  constructor(private helper: ZkHelper, private config: ConfigService, private logger: BusinessLogger) {
    // 获取系统的状态
    // 如果系统的状态不好 就关闭与zk之间的连接
    // 因为registor的时候 是创建的临时节点 所以断开后 会自动被删除
    this.intervalSystemState();
    // 循环执行定制注册任务 保持与zk的心跳
    this.nextTick();
  }

  /**
   * 暴露给用户  自己判断是否需要断开zookeeper连接
   * @param cpu
   * @param avg5
   * @param avg15
   * @param heap
   */
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
   * 用于监听系统的状态 返回是否需要关闭zk 同时操作
   * @param polling
   */
  private intervalSystemState(polling: number = 5 * 1000) {
    const stateSubject = new Subject();
    // 状态判断
    stateSubject
      .pipe(
        // 判断是否需要断开zookeeper连接
        switchMap((sender: any) => {
          const { cpu, avg5, avg15, heap } = sender;
          let isNeedClose = this.isNeedBreakZK(cpu, avg5, avg15, heap);
          this.systemState = isNeedClose =
            typeof isNeedClose === 'boolean' ? isNeedClose : this.isBreakZk(cpu, avg5, avg15, heap);
          return of(this.systemState);
        }),
        // 操作是否关闭zk
        tap((state) => of(state ? this.helper.close() : state)),
      )
      .subscribe();
    // 触发轮询
    return this.intervalSystemWeight(polling, stateSubject);
  }

  /**
   * 轮询获取系统状态
   * @param polling
   * @param listener
   */
  private intervalSystemWeight(polling: number = 5 * 1000, listener?: Function | Subject<any>) {
    // 回调函数
    const callback = typeof listener === 'function' ? listener : function () {};
    // 通知用户用的
    const noticeSubject = listener instanceof Subject ? listener : new Subject();
    // 定时开始轮询
    return interval(polling)
      .pipe(
        // 获取当前服务器状态
        switchMap((num) => from(GetSystemWeight())),
        // 获取到服务器状态 记录状态
        tap((sender: any) => (this.systemWeiget = sender)),
        // 触发回调
        tap((sender: any) => callback(sender)),
      )
      .subscribe(noticeSubject);
  }

  /**
   * 定时任务
   */
  private nextTick(polling: number = 60 * 1000) {
    return timer(0, polling)
      .pipe(
        // 如果系统状态不好， 就不在返回注册列表进行注册
        switchMap((num) => of(this.systemState ? [] : Array.from(this.liveHeadTask.values()))),
        // 记录日志
        tap((tasks) =>
          this.logger.log(`[CenterService-nextTick] \r\n 当前调用注册中心的task:${JSON.stringify(tasks)}`),
        ),
        // 执行定时任务
        switchMap((tasks) => from(tasks)),
        // 循环注册
        tap(async (currentTask: any) => {
          const systemWeiget = this.systemWeiget || (await GetSystemWeight());
          try {
            //确保节点还存在中
            const path = await this.registerZK({ ...currentTask, weight: systemWeiget.weight });
            //写入节点数据
            await this.helper.setData(
              String(path),
              JSON.stringify({ ip: currentTask.serverIP, port: currentTask.serverPort, weight: systemWeiget.weight }),
            );
          } catch (error) {}
        }),
      )
      .subscribe();
  }

  /**
   * 注册服务 同时启动心跳
   * @param params
   */
  public async register(params: registerConfig) {
    const {
      weight = (this.systemWeiget && this.systemWeiget.weight) || (await GetSystemWeight()).weight,
      systemName,
      serviceName,
      serverIP,
      serverPort,
    } = params;
    // 加入到队列 方便定时注册
    this.liveHeadTask.set(fastSafeStringify({ systemName, serviceName, serverIP, serverPort }), params);
    // 开始注册
    const registerPath = await this.registerZK({ weight, systemName, serviceName, serverIP, serverPort });
    // 返回注册后的路径
    return registerPath;
  }

  /**
   * 取消注册 同时取消心跳
   * @param params
   */
  public async unregister(params: registerConfig) {
    const { systemName, serviceName, serverIP, serverPort } = params;
    const del = await this.unRegisterZK(params);
    this.liveHeadTask.delete(fastSafeStringify({ systemName, serviceName, serverIP, serverPort }));
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
