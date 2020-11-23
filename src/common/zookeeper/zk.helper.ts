/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-25 14:00:41
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-11-23 19:03:31
 */
import { createClient, CreateMode, ACL, Permission, Id } from 'node-zookeeper-client';
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

// interface zookeeperHelper {
//   [key: string]: any;
//   createServer(): any;
//   create(path: string, data: string, acls: any[], mode: number): Promise<unknown>;
//   connect(): Promise<unknown>;
//   setData(path: string, data?: string, version?: number): Promise<unknown>;
//   getData(path: string, watcher?: Function): Promise<unknown>;
//   close(): void;
//   getState(): unknown;
//   setACL(path: string, acls?: any[], version?: number): Promise<unknown>;
//   getACL(path: string): Promise<unknown>;
//   listSubTreeBFS(path: string): Promise<unknown>;
//   mkdirp(path: string, data?: string, acls?: any[], mode?: number): Promise<unknown>;
//   remove(path: string, version?: number): Promise<unknown>;
//   exists(path: string, watcher?: Function): Promise<boolean>;
//   getChildren(path: string, watcher?: Function): Promise<unknown>;
// }

@Injectable()
export class ZkHelper {
  //方便字典
  [name: string]: any;
  //zookeeper client
  private client!: any;
  constructor(private logger: BusinessLogger, private config: ConfigService) {
    this.initConstructor();
  }

  /**
   * 初始化
   */
  private initConstructor() {
    const methodNames = this.getUseMethodNames();
    methodNames.forEach((name) => {
      const notPromiseFunc = ['getState', 'close', 'createServer', 'listener'].includes(name);
      const senderFunc = this[name].bind(this);
      this[name] = notPromiseFunc
        ? senderFunc
        : //在调用方法前 确保已经连接上zk服务器
          async (...args: any[]) => {
            const isBreak = !this.hasConnect();
            if (name != 'connect' && isBreak) {
              this.close();
              await this.connect();
            }
            let result;
            try {
              result = await senderFunc(...args);
              this.logger.log(
                `[ZkHelper-initConstructor] \r\n 调用方法:${name} 调用方法参数:${JSON.stringify(
                  args,
                )} 返回结果:${JSON.stringify(result)}`,
              );
            } catch (err) {
              this.logger.error(
                `[ZkHelper-initConstructor] \r\n 调用方法:${name} 调用方法参数:${JSON.stringify(args)} 调用出错${err}`,
              );
            }
            return result;
          };
    });
  }
  /**
   * 获取到需要操作zookeeper的方法名
   */
  private getUseMethodNames() {
    return Object.getOwnPropertyNames(ZkHelper.prototype).filter(
      (key) =>
        !['constructor', 'helper', 'createInstance', 'hasConnect', 'connect'].find((name) => key == name) &&
        typeof ZkHelper.prototype[key] === 'function',
    );
  }
  /**
   * 是否还在连接中
   */
  private hasConnect() {
    const state = this.getState() as any;
    const stateName = state.getName();
    //打印日志
    this.logger.log(`[ZkHelper-hasConnect] \r\n zookeeper state:${stateName}`);
    return ['CONNECTED_READ_ONLY', 'SYNC_CONNECTED', 'SASL_AUTHENTICATED'].includes(stateName);
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
   * 设置节点的ACL
   * @param path
   * @param acls
   * @param version
   */
  public setACL(path: string, acls: any[] = ACLS.OPEN_ACL_UNSAFE, version: number = -1): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.setACL(path, acls, (error: any, acls: any, stat: any) => {
      if (error) {
        return reject(error);
      }
      resolve(acls);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 获取节点的ACL
   * @param path
   */
  public getACL(path: string): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.getACL(path, (error: any, acls: any, stat: any) => {
      if (error) {
        return reject(error);
      }
      resolve(acls);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 获取当前路径下所有子节点
   * @param path
   */
  public listSubTreeBFS(path: string): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.listSubTreeBFS(path, (error: any, children: any) => {
      if (error) {
        return reject(error);
      }
      resolve(children);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 获取子节点
   * @param path
   * @param watcher
   */
  public getChildren(path: string, watcher?: Function): Promise<unknown> {
    let resolve: Function | null = null,
      reject: Function | null = null;
    this.client.getChildren(path, watcher, (error: any, children: any) => {
      if (error) {
        if (typeof reject === 'function') {
          reject(error);
        } else {
          typeof watcher === 'function' && watcher('error');
        }
        (reject = null), (resolve = null);
        return;
      }
      typeof resolve === 'function' && resolve(children);
      (reject = null), (resolve = null);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
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
  ): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.mkdirp(path, Buffer.from(data), acls, mode, (error: any, path: any) => {
      if (error) {
        return reject(error);
      }

      resolve(path);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
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
  ): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.create(path, Buffer.from(data), acls, mode, (error: any, path: any) => {
      if (error) {
        return reject(error);
      }
      resolve(path);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 删除节点
   * @param path
   * @param version
   */
  public remove(path: string, version: number = -1): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.removeRecursive(path, version, (error: any) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 查看节点是否存在
   * @param path
   * @param watcher
   */
  public exists(path: string, watcher?: Function): Promise<boolean> {
    let resolve: Function | null = null,
      reject: Function | null = null;
    this.client.exists(path, watcher, (error: any, state: any) => {
      if (error) {
        if (typeof reject === 'function') {
          reject(error);
        } else {
          typeof watcher === 'function' && watcher('error');
        }
        (reject = null), (resolve = null);
        return;
      }
      typeof resolve === 'function' && resolve(!!state);
      (reject = null), (resolve = null);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 设置节点的值
   * @param path
   * @param data
   * @param version
   */
  public setData(path: string, data: string = '', version: number = -1): Promise<unknown> {
    let resolve: Function, reject: Function;
    this.client.setData(path, Buffer.from(data), version, (error: any, state: any) => {
      if (error) {
        return reject(error);
      }
      resolve(state);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 获取节点的值
   * @param path
   * @param watcher
   */
  public getData(path: string, watcher?: Function): Promise<unknown> {
    let resolve: Function | null = null,
      reject: Function | null = null;
    this.client.getData(path, watcher, (error: any, data: any) => {
      if (error) {
        if (typeof reject === 'function') {
          reject(error);
        } else {
          typeof watcher === 'function' && watcher('error');
        }
        (reject = null), (resolve = null);
        return;
      }
      typeof resolve === 'function' && resolve(data.toString('utf8'));
      (reject = null), (resolve = null);
    });
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
  }

  /**
   * 监听相关事件
   */
  private listener() {
    if (!this.client) {
      throw new Error('请初始化zookeeper client.');
    }
    this.client.on('connected', () => {
      this.logger.log(
        `[zookeeper-listener] zookeeper is connected. sessionID:${this.client.getSessionId().toString('hex')}`,
      );
    });
    this.client.on('disconnected', () => {
      this.logger.log(`zookeeper is disconnected`);
    });
    this.client.on('expired', () => {
      this.logger.log(`zookeeper is expired`);
    });
    this.client.on('connectedReadOnly', () => {
      this.logger.log(
        `[zookeeper-listener] zookeeper is connectedReadOnly. sessionID:${this.client.getSessionId().toString('hex')}`,
      );
    });
    this.client.on('authenticationFailed', () => {
      this.logger.log(`authentication failed of zookeeper`);
    });
    this.client.on('state', (state: any) => {
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
   * 创建zk客户端
   * @param options
   */
  public createServer() {
    if (this.client) {
      return this.client;
    }
    //和配置文件拿到相关配置
    this.client = createClient(this.config.get('SERVERS'), {
      sessionTimeout: Number(this.config.get<number>('SESSIONTIMEOUT')),
      spinDelay: Number(this.config.get<number>('SPINDELAY')),
      retries: Number(this.config.get<number>('RETRIES')),
    });
    this.listener();
    return this.client;
  }

  /**
   * 连接
   */
  public connect(): Promise<unknown> {
    let resolve: Function, reject: Function, timeHandler: any;
    if (!this.client) {
      this.createServer();
    }
    this.client.once('connected', () => {
      resolve != empty && resolve(), (reject = resolve = empty), timeHandler && clearTimeout(timeHandler);
    });
    this.client.connect();
    //连接30秒超时
    timeHandler = setTimeout(() => {
      reject && reject(), (reject = resolve = empty);
    }, 30 * 1000);
    return new Promise((res, rej) => {
      (resolve = res), (reject = rej);
    });
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
