/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-25 14:00:41
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-11-23 19:14:41
 */
import { Client, createClient, CreateMode, ACL, Permission, Id } from 'node-zookeeper-client';
import { BusinessLogger } from '../logger/logger';
import { Injectable } from 'zego-injector';
import { ConfigService } from 'zego-config';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

const empty = () => {};
//zookeeper的辅助
const IDS = {
  ANYONE_ID_UNSAFE: new Id('world', 'anyone'),
  AUTH_IDS: new Id('auth', ''),
};
//zookeeper的辅助
export const ACLS = {
  OPEN_ACL_UNSAFE: [new ACL(Permission.ALL, IDS.ANYONE_ID_UNSAFE)],
  CREATOR_ALL_ACL: [new ACL(Permission.ALL, IDS.AUTH_IDS)],
  READ_ACL_UNSAFE: [new ACL(Permission.READ, IDS.ANYONE_ID_UNSAFE)],
};

@Injectable()
export class ZkHelper {
  //方便字典
  [name: string]: any;
  //zookeeper client
  private client!: any;
  constructor(private logger: BusinessLogger, private config: ConfigService) {}

  /**
   * 调用node-zookeeper-client方法
   */
  private callLib(methodName: string, ...args: any[]) {
    if (!this.client) {
      this.createServer();
    }
    // 确保是调用的client
    if (!(methodName in this.client) || typeof this.client[methodName] !== 'function') {
      return Promise.reject(`[ZkHelper-callLib] - ${methodName} is not a function.`);
    }
    // 创建一个promise回调
    const { timeout, success, error, promise } = this.createPromise();
    // 创建连接
    this.connect()
      .then(() => {
        const result = this.client[methodName](...args);
        // 调用成功
        success(result);
      })
      .catch(error);
    // 返回promise
    return promise;
  }

  /**
   * 是否还在连接中
   */
  private hasConnect() {
    const state = this.getState() as any;
    const stateName = state.getName();
    // 打印日志
    // this.logger.log(`[ZkHelper-hasConnect] \r\n zookeeper state:${stateName}`);
    // 处于连接状态
    return ['CONNECTED_READ_ONLY', 'SYNC_CONNECTED', 'SASL_AUTHENTICATED'].includes(stateName);
  }

  /**
   * 创建一个promise的回调
   */
  private createPromise() {
    // promise
    let resolve: Function = empty,
      reject: Function = empty,
      timeHandler: any;
    // promise的对象
    let result = new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
    // 成功和失败之后 都要的回调
    let complete = () => {
      // 关闭倒计时
      timeHandler && clearTimeout(timeHandler);
      // 清空回调
      resolve = reject = empty;
    };
    // 成功回调
    let success = (ang: any) => {
      resolve != empty && resolve(ang);
      complete();
    };
    // 失败回调
    let error = (ang: any) => {
      reject != empty && reject(ang);
      complete();
    };
    // 开始倒计时
    let timeout = (time: number = 30 * 1000) => {
      //连接30秒超时
      timeHandler = setTimeout(() => {
        // 错误回调
        reject != empty && reject('timeout');
        // 清空回调
        complete();
      }, time);
    };

    return {
      timeout,
      promise: result,
      success,
      error,
    };
  }

  /**
   * 连接zk
   */
  private connect() {
    const isConnected = this.hasConnect();
    // 如果已经是连接状态 就不在重复连接
    if (isConnected) {
      return Promise.resolve();
    }
    // 创建一个promise回调
    const { timeout, success, error, promise } = this.createPromise();
    // 连接成功
    this.client.once('connected', success);
    try {
      // 开始连接
      this.client.connect();
      // timeout
      timeout();
    } catch (err) {
      error(err);
    }
    return promise;
  }

  /**
   * 获取当前状态
   */
  public getState(): any {
    if (!this.client) {
      this.createServer();
    }
    return this.client.getState();
  }

  /**
   * 创建zk客户端
   * @param options
   */
  public createServer() {
    if (this.client) {
      return this.client;
    }
    // 和配置文件拿到相关配置
    this.client = createClient(this.config.get('SERVERS'), {
      sessionTimeout: Number(this.config.get<number>('SESSIONTIMEOUT')),
      spinDelay: Number(this.config.get<number>('SPINDELAY')),
      retries: Number(this.config.get<number>('RETRIES')),
    });
    // 监听日志
    this.listener();
    return this.client;
  }

  private getLib(methodName: string, ...args: any[]): Promise<any> {
    // 创建一个promise回调
    const { timeout, success: promiseSuccess, error: promiseError, promise } = this.createPromise();
    // 调用setACL方法
    this.callLib(methodName, ...args, (error: any, result: any, stat: any) => {
      // 有错误
      if (error) {
        // 打印日志
        this.logger.error(
          `[ZkHelper-initConstructor] \r\n 调用方法:${methodName} 调用方法参数:${JSON.stringify(
            args,
          )} 调用出错${error}`,
        );
        return promiseError(error);
      }
      // 打印日志
      this.logger.log(
        `[ZkHelper-initConstructor] \r\n 调用方法:${methodName} 调用方法参数:${JSON.stringify(
          args,
        )} 返回结果:${JSON.stringify(result)}`,
      );
      // 返回成功
      promiseSuccess(result);
    }).catch(promiseError);
    return promise;
  }

  /**
   * 设置节点的ACL
   * @param path
   * @param acls
   * @param version
   */
  public setACL(path: string, acls: any[] = ACLS.OPEN_ACL_UNSAFE, version: number = -1): Promise<any> {
    return this.getLib('setACL', path, acls);
  }

  /**
   * 获取节点的ACL
   * @param path
   */
  public getACL(path: string): Promise<any> {
    return this.getLib('getACL', path);
  }

  /**
   * 获取当前路径下所有子节点
   * @param path
   */
  public listSubTreeBFS(path: string): Promise<any> {
    return this.getLib('listSubTreeBFS', path);
  }

  /**
   * 获取子节点
   * @param path
   * @param watcher 第一个参数是err 当成功的时候 err = null. 否则就是错误信息
   */
  public getChildren(path: string, watcher?: Function): Promise<any> {
    return this.getLib('getChildren', path);
    // return this.getLib('getChildren',path,async () => {
    //   try{
    //     const result = await this.getChildren(path,watcher)
    //     typeof watcher === "function" && watcher(null,result)
    //   }catch(err){
    //     typeof watcher === "function" && watcher(err)
    //   }
    // })
  }

  /**
   * 以类似mkdir -p的方式创建节点 比如/test-zk/demo/1/2/3
   * @param path
   * @param data
   * @param acls
   * @param mode
   */
  public mkdirp(
    path: string,
    data: string = '',
    acls: any[] = ACLS.OPEN_ACL_UNSAFE,
    mode: number = CreateMode.PERSISTENT,
  ): Promise<any> {
    return this.getLib('mkdirp', path, Buffer.from(data), acls, mode);
  }

  /**
   * 创建节点
   * @param path
   * @param data
   * @param acls
   * @param mode
   */
  public create(
    path: string,
    data: string = '',
    acls: any[] = ACLS.OPEN_ACL_UNSAFE,
    mode: number = CreateMode.PERSISTENT,
  ): Promise<any> {
    return this.getLib('create', path, Buffer.from(data), acls, mode);
  }

  /**
   * 删除节点
   * @param path
   * @param version
   */
  public remove(path: string, version: number = -1): Promise<any> {
    return this.getLib('removeRecursive', path, version);
  }

  /**
   * 查看节点是否存在
   * @param path
   * @param watcher
   */
  public exists(path: string, watcher?: Function): Promise<any> {
    return this.getLib('exists', path);
    // return this.getLib('exists',path,async () => {
    //   try{
    //     const result = await this.exists(path,watcher)
    //     typeof watcher === "function" && watcher(null,result)
    //   }catch(err){
    //     typeof watcher === "function" && watcher(err)
    //   }
    // })
  }

  /**
   * 设置节点的值
   * @param path
   * @param data
   * @param version
   */
  public setData(path: string, data: string = '', version: number = -1): Promise<any> {
    return this.getLib('setData', path, Buffer.from(data), version);
  }

  /**
   * 获取节点的值
   * @param path
   * @param watcher
   */
  public getData(path: string, watcher?: Function): Promise<unknown> {
    return this.getLib('getData', path).then((data: any) => Promise.resolve(data.toString('utf8')));
    // return this.getLib('getData',path,async () => {
    //   try{
    //     const result = await this.getData(path,watcher)
    //     typeof watcher === "function" && watcher(null,result)
    //   }catch(err){
    //     typeof watcher === "function" && watcher(err)
    //   }
    // }).then((data:any) => Promise.resolve(data.toString('utf8')))
  }

  /**
   * 监听相关事件
   */
  private listener() {
    if (!this.client) {
      throw new Error('请初始化zookeeper client.');
    }
    this.client.removeAllListeners('connected').on('connected', () => {
      this.logger.log(
        `[zookeeper-listener] zookeeper is connected. sessionID:${this.client.getSessionId().toString('hex')}`,
      );
    });
    this.client.removeAllListeners('disconnected').on('disconnected', () => {
      this.logger.log(`zookeeper is disconnected`);
    });
    this.client.on('expired', () => {
      this.logger.log(`zookeeper is expired`);
    });
    this.client.removeAllListeners('connectedReadOnly').on('connectedReadOnly', () => {
      this.logger.log(
        `[zookeeper-listener] zookeeper is connectedReadOnly. sessionID:${this.client.getSessionId().toString('hex')}`,
      );
    });
    this.client.removeAllListeners('authenticationFailed').on('authenticationFailed', () => {
      this.logger.log(`authentication failed of zookeeper`);
    });
    this.client.removeAllListeners('state').on('state', (state: any) => {
      this.logger.log(`state is change of zookeeper. state:${state}`);
    });

    process.removeAllListeners('uncaughtException').on('uncaughtException', (err: any) => {
      this.logger.log('Error caught in uncaughtException event:', err);
    });
    // process.on('SIGINT',this.close.bind(this))
    // process.on('uncaughtException',this.close.bind(this))
    // process.on('SIGTERM', this.close.bind(this))
  }

  /**
   * 关闭
   */
  public close() {
    this.logger.log('触发close');
    const noop = function () {};
    const client = this.client || { close: noop, removeAllListeners: noop };

    try {
      // 关闭连接
      client.close();
    } catch (err) {}

    // 解绑事件
    ['connected', 'disconnected', 'connectedReadOnly', 'authenticationFailed', 'expired', 'state'].forEach(
      client.removeAllListeners.bind(client),
    );
    delete this.client;
  }
}
