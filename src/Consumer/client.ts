/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-09-01 10:50:22
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-10-29 19:31:41
 */
import { ZkHelper } from '../common/zookeeper/zk.helper';
import { Injectable } from 'zego-injector';
import { ConfigService } from 'zego-config';
import * as Path from 'path';
import * as Event from 'events';
import { BusinessLogger } from '../common/logger/logger';
import { WeightRoundRobin } from '../common/balancers/balance.weight.round.robin';
import { Subject, interval, from, Subscription, merge, fromEvent, of, timer, Observable, BehaviorSubject, throwError } from 'rxjs';
import { map,retry, tap, switchMap, debounceTime, distinctUntilChanged, take, filter, scan, takeUntil, switchMapTo, catchError, timeout, delay, mapTo } from 'rxjs/operators';

type subscibeConfig = {
  // 属于哪个系统
  systemName: string;
  // 属于哪个服务
  serviceName: string;
  // 是否需要监听权重
  isNeedWacherWeight?: boolean
};

type wacherParams = {
  path: string;
  subscribe?: Subject<any>;
  timer?: number;
};

type nodeData = { ip: string; port: number; weight: number };

type node = {
  node: string;
  nodePath: string;
  data: nodeData | null;
  subscribe: Subscription;
};

enum eventName {
  NODE_CHILD_DELETE = 'node-child-delete',
  NODE_CHILD_ADD = 'node-child-add',
  CHILDNODE_DELETE = 'child-delete',
  CHILDNODE_ADD = 'child-add',
  CHILDNODE_UPDATE = 'child-update',
}

@Injectable()
export class CenterClient extends Event.EventEmitter {
  // 用于字典
  [name: string]: any;
  // 用于记录哪些正在被监听的
  private nodes: Map<string, { subscribe?: Subscription; childMap: Map<string, node> }> = new Map();

  constructor(private helper: ZkHelper, private config: ConfigService, private logger: BusinessLogger) {
    super();
    this.distributionEvent();
    this.defaultTimer = 3000;
  }

  /**
   * 事件分发
   */
  private distributionEvent() {
    const events = [
      eventName.NODE_CHILD_DELETE,
      eventName.CHILDNODE_DELETE,
      eventName.NODE_CHILD_ADD,
      eventName.CHILDNODE_ADD,
      eventName.CHILDNODE_UPDATE,
    ];
    // 进行事件分发
    events.forEach((name) => {
      // 分发规则 eventName:nodePath
      this.on(name, (sender) => this.emit(`${name}:${sender.nodePath}`, sender));
    });
  }

  /**
   * 对外 监听服务 并且拿到最新的 服务器
   * @param params
   * @param listener
   */
  public subscribe(params: subscibeConfig, listener: Function | Subject<any>,isNeedWacherWeight:boolean = false) {
    const { systemName, serviceName  } = params;
    const serverPath = Path.join(systemName, serviceName);
    // 兼容之前
    isNeedWacherWeight = params.isNeedWacherWeight || isNeedWacherWeight;
    // 监听节点 触发事件
    this.subscribeWacherNode(serverPath);

    // 用户回调函数
    const callback = typeof listener === "function"? listener : function(){}
    // 通知用户用的
    const noticeSubject = listener instanceof Subject? listener : new Subject()

    noticeSubject.pipe(
      // 防抖
      debounceTime(300),
      // 去重
      distinctUntilChanged((prev,next) => prev != null && next != null && JSON.stringify(prev) == JSON.stringify(next)),
      // 通知用户
      tap(server => callback(server))
    ).subscribe()

    // 节点被删除
    fromEvent(this,`${eventName.NODE_CHILD_DELETE}:${serverPath}`)
      .pipe(tap(event => callback(null)))
      .subscribe(noticeSubject)
    // 单节点被删除
    fromEvent(this, `${eventName.CHILDNODE_DELETE}:${serverPath}`)
      .pipe(switchMap(event => of(this.getNextServer(serverPath))))
      .subscribe(noticeSubject)
    // // 节点被添加
    // fromEvent(this, `${eventName.CHILDNODE_ADD}:${serverPath}`)
    //   .pipe(switchMap(event => of(this.getNextServer(serverPath))),filter(server => server != null))
    //   .subscribe(noticeSubject)
    // 节点数据变更
    isNeedWacherWeight && fromEvent(this, `${eventName.CHILDNODE_UPDATE}:${serverPath}`)
      .pipe(
        tap(event => console.log("节点数据变更")), 
        switchMap(event => of(this.getNextServer(serverPath)))
      )
      .subscribe(noticeSubject)
  }

  /**
   * 获取下一次的服务地址
   * 如果没有可用的服务器 则返回null
   * serverPath = Path.join(systemName, serviceName)
   * @param path
   */
  public getNextServer(serverPath: string) {
    const childNodeMap = this.nodes.get(serverPath);
    const serverList = Array.from(childNodeMap?.childMap?.values() || [])
      .filter((sender) => sender.data)
      .map((sender) => {
        const { ip, port, weight } = sender.data || { ip: '', port: 0, weight: 0 };
        return { address: `${ip}:${port}`, ip, port, weight };
      });
    if (!serverList || !Array.isArray(serverList) || serverList.length <= 0) {
      return null;
    }
    const balanceHelper = new WeightRoundRobin(serverList, 1);
    const nextServerIP = balanceHelper.getAddress();
    return serverList.find((sender) => sender.address === nextServerIP);
  }

  /**
   * 取消监听
   * @param params
   * @param listener
   */
  public unSubscribe(params: subscibeConfig, listener?: Function) {
    const { systemName, serviceName } = params;
    const serverPath = Path.join(systemName, serviceName);
    this.removeAllListeners(`${eventName.CHILDNODE_DELETE}:${serverPath}`);
    this.removeAllListeners(`${eventName.CHILDNODE_ADD}:${serverPath}`);
    this.removeAllListeners(`${eventName.CHILDNODE_UPDATE}:${serverPath}`);
    this.unsunscribeNode(serverPath);
  }

  /**
   * 取消监听节点
   * @param nodePath
   */
  public unsunscribeNode(nodePath: string) {
    // 根节点不存在
    if (!this.nodes.has(nodePath)) {
      return;
    }
    // 拿到subscribe
    const { subscribe, childMap } = this.nodes.get(nodePath) || {};
    // 子节点删除监听
    if (typeof childMap !== 'undefined' && childMap instanceof Map) {
      // 删除数据节点的监听
      const children = Array.from(childMap.values());
      // 引用类型 所以可以直接删除
      children.forEach(({ node, data }) => {
        // 停止监听
        this.unsubscribeData(nodePath, node);
      });
    }
    // 执行unsubscribe
    subscribe && typeof subscribe.unsubscribe === 'function' && subscribe.unsubscribe();
    // 删除
    this.nodes.delete(nodePath);
  }

  /**
   * 取消监听数据
   * @param nodePath
   * @param child
   */
  public unsubscribeData(nodePath: string, child: string) {
    // 根节点不存在
    if (!this.nodes.has(nodePath)) {
      return;
    }
    // 拿到childMap
    const { childMap } = this.nodes.get(nodePath) || {};
    // data节点不存在
    if (!(childMap instanceof Map) || !childMap?.has(child)) {
      return;
    }
    // 拿到data的subscribe
    const { subscribe } = childMap?.get(child) || {};
    // 执行unsubscribe
    subscribe && typeof subscribe.unsubscribe === 'function' && subscribe.unsubscribe();
    // 删除nodeData
    childMap.delete(child);
  }

  /**
   * 监听child的变化
   * @param path
   * @param child
   */
  public subscribeWacherData(path: string, child: string) {
    // 已经被取消监听 所以不需要在继续监听data了
    if (!this.nodes.has(path)) {
      return;
    }
    // 获取根节点数据
    const nodeSender = this.nodes.get(path) || { childMap: null };
    // 获取data节点的映射
    const childMap: Map<string, node> = (nodeSender.childMap = nodeSender.childMap || new Map());
    // 已经被监听过 不在重复监听
    if (childMap.has(child)) {
      return childMap.get(child)?.subscribe;
    }
    const subscribe = new Subject();
    const dataSubscribe = this.wacherData({ path: Path.join(path, child), subscribe });
    const dataSender = { nodePath: path, node: child, subscribe: dataSubscribe, data: null,prevString:null };
    // 数据回调
    const dataCallback = (data: any) => {
      try {
        // 转换对象
        const nextData = JSON.parse(data);
        const prevString = dataSender.prevString;
        // 更新本地数据
        dataSender.data = nextData;
        dataSender.prevString = data;
        // 看看数据是否有改变 有改变就触发update事件
        if (data !== prevString) {
          this.logger.log(`有节点变更,prev:${prevString}. current:${data}`)
          // 触发单独的添加事件
          this.emit(eventName.CHILDNODE_UPDATE, {
            nodePath:path,
            childPath: child,
            prevChildData: dataSender.data,
            childData: nextData,
          });
        }
        
      } catch (err) {}
    };
    subscribe.pipe(tap(dataCallback)).subscribe({
      next: (value) => {
        //this.logger.log(value,"subscribeWacherData")
      },
    });
    // 记录已经被监听
    childMap.set(child, dataSender);
    // 返回subscribe
    return dataSubscribe;
  }

  /**
   * 监听节点的变化
   * @param path
   */
  public subscribeWacherNode(path: string) {
    // 已经被监听过 不在重复监听
    if (this.nodes.has(path)) {
      return this.nodes.get(path)?.subscribe;
    }
    const subscribe = new Subject();
    const nodeSubscribe = this.wacherNode({ path, subscribe });
    const nodeSender = { subscribe: nodeSubscribe, childMap: new Map() };
    // 节点数据回调
    const childrenCallback = (children: any) => {
      // 没有节点的处理逻辑
      if (!children || !Array.isArray(children) || children.length <= 0) {
        const children = Array.from(nodeSender.childMap.values());
        // 引用类型 所以可以直接删除
        children.forEach(({ node, data }) => {
          // 停止监听
          this.unsubscribeData(path, node);
          // 删除
          nodeSender.childMap.delete(node);
          // 触发事件
          this.emit(eventName.CHILDNODE_DELETE, { nodePath: path, childPath: node, childData: data });
        });
        // 清空map
        nodeSender.childMap = new Map();
        // 触发一个总事件
        this.emit(eventName.NODE_CHILD_DELETE, { nodePath: path, childrenPath: children });
        // 记录日志
        this.logger.log(`根节点被删除:${path}`)
        // 停止往下执行
        return;
      }

      // 找到被删除的节点
      const delNode = Array.from(nodeSender.childMap?.keys() || []).filter((child) => {
        // 计算是否被删除的
        const result = !children.includes(child);
        // 被删除了
        if(result){
          this.unsubscribeData(path,child);
          // 触发单独事件 删除事件
          this.emit(eventName.CHILDNODE_DELETE, {
            nodePath: path,
            childPath: child,
            childData: nodeSender.childMap?.get(child),
          });
          // 记录日志
          this.logger.log(`单节点被删除,path:${path}. child:${child}`)
        }
        // 返回过滤结果
        return result;
      });
      // 找到新增加的节点
      const addNode = children.filter((child) => {
        // 计算是否被添加的
        const result = !nodeSender.childMap?.has(child);
        // 被添加了
        if(result){
          // 进行监听数据
          this.subscribeWacherData(path, child);
          // 触发单独的添加事件 添加事件
          this.emit(eventName.CHILDNODE_ADD, { nodePath: path, childPath: child });
          // 记录日志
          this.logger.log(`单节点被添加,path:${path}. child:${child}`)
        }
        // 返回过滤结果
        return result;
      });

      // 触发事件
      if (delNode.length > 0) {
        // 触发一个总事件
        // 节点删除事件  childrenPath是子节点的路径不包含数据
        this.emit(eventName.NODE_CHILD_DELETE, { nodePath: path, childrenPath: delNode });
      }
      // 触发一个总的 添加事件
      if (addNode.length > 0) {
        // 触发一个总事件
        // 节点添加事件  childrenPath是子节点的路径不包含数据
        this.emit(eventName.NODE_CHILD_ADD, { nodePath: path, childrenPath: addNode });
      }
    };
    subscribe.pipe(tap(childrenCallback)).subscribe({
      next: (value) => {
        //this.logger.log(value,"subscribeWacherNode")
      },
    });
    // 记录已经被监听
    this.nodes.set(path, nodeSender);
    // 返回subscribe
    return nodeSubscribe;
  }

  /**
   * 原始监听
   * @param sender
   */
  private wacherData(sender: wacherParams) {
    const { timer = this.defaultTimer, subscribe, path } = sender;
    return interval(timer)
      .pipe(
        // 获取最新节点
        switchMap((num) => from(this.helper.getData(path))),
        // 处理拿到的节点数据
        tap((data: any) => {
          // console.log(data, 'wacherData');
        }),
        // 报错重新监听
        retry(),
      )
      .subscribe(subscribe);
  }

  /**
   * 原始监听
   * @param sender
   */
  private wacherNode(sender: wacherParams) {
    const { timer = this.defaultTimer, subscribe, path } = sender;
    return interval(timer)
      .pipe(
        // 获取最新节点
        switchMap((num) => from(this.helper.getChildren(path))),
        // 处理拿到的节点数据
        tap((children: any) => {
          // console.log(children, 'wacherNode');
        }),
        // 报错重新监听
        retry(),
      )
      .subscribe(subscribe);
  }
}
