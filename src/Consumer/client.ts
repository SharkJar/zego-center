/*
 * @Author: Johnny.xushaojia 
 * @Date: 2020-09-01 10:50:22 
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-09-02 15:58:40
 */
import { ZkHelper,ACLS } from '../common/zookeeper/zk.helper'
import { Injectable } from '../common/injector/injectable'
import { ConfigService } from '../common/config/configService'
import * as Path from 'path'
import * as Event from 'events'
import { BusinessLogger } from '../common/logger/logger'
import { WeightRoundRobin } from '../common/balancers/balance.weight.round.robin'

type subscibeConfig = { 
    //属于哪个系统
    systemName:string,
    //属于哪个服务
    serviceName:string
}

type nodeData = { ip:string,port:number,weight:number }

type node = {
    node:string,
    nodePath:string,
    data:nodeData
}

enum eventName{
    NODE_CHILD_DELETE = "node-child-delete",
    NODE_CHILD_ADD = "node-child-add",
    CHILDNODE_DELETE = "child-delete",
    CHILDNODE_ADD = "child-add",
    CHILDNODE_UPDATE = "child-update"
}

@Injectable()
export class CenterClient extends Event.EventEmitter{
    //用于字典
    [name: string]: any
    //用于记录哪些正在被监听的
    private nodes:Map<string,Map<string,node>> = new Map()

    constructor(
        private helper:ZkHelper,
        private config:ConfigService,
        private logger:BusinessLogger
    ){
        super()
        this.distributionEvent()
    }

    /**
     * 事件分发
     */
    private distributionEvent(){
        const events = [eventName.NODE_CHILD_DELETE,eventName.CHILDNODE_DELETE,eventName.NODE_CHILD_ADD,eventName.CHILDNODE_ADD,eventName.CHILDNODE_UPDATE]
        //进行事件分发  
        events.forEach(name => {
            //分发规则 eventName:nodePath 
            this.on(name,sender => this.emit(`${name}:${sender.nodePath}`,sender))
        })
    }

    /**
     * 监听一个服务节点
     * @param path 
     */
    private async wacherNode(path: string){
        //用于记录老的关系  用于判断增删改
        const childMap:Map<string,node> | undefined = this.nodes.get(path)
        const children:string[] = await this.helper.getChildren(path,this.wacherNode.bind(this,path)) as string[]

        //没有节点的处理逻辑
        if(!children || !Array.isArray(children) || children.length <= 0){
            //删除节点
            this.nodes.delete(path)
            //如果之前已经存在的有节点 那么触发的是删除事件
            const isExistsNode = childMap?.size && childMap?.size > 0
            //触发事件
            if(isExistsNode){
                const childrenPath = Array.from(childMap?.keys() || [])
                //触发一个总事件
                this.emit(eventName.NODE_CHILD_DELETE,{ nodePath:path,childrenPath })
                //触发单独的事件
                childrenPath.forEach(childPath => this.emit(eventName.CHILDNODE_DELETE,{ nodePath:path,childPath,childData:childMap?.get(childPath) }))
            }
            return
        }

        //重新初始化一个map
        this.nodes.set(path,new Map())
        //找到被删除的节点
        const delNode = Array.from(childMap?.keys() || []).filter(child => !children.includes(child))
        //找到新增加的节点
        const addNode = children.filter(child => !childMap?.has(child))
        //触发事件
        if(delNode.length > 0){
            //触发一个总事件
            //节点删除事件  childrenPath是子节点的路径不包含数据
            this.emit(eventName.NODE_CHILD_DELETE,{ nodePath:path,childrenPath:delNode })
            //触发单独事件
            delNode.forEach(childPath => this.emit(eventName.CHILDNODE_DELETE,{ nodePath:path,childPath,childData:childMap?.get(childPath) }))
        }
        //触发一个总的 添加事件
        if(addNode.length > 0){
            //触发一个总事件
            //节点添加事件  childrenPath是子节点的路径不包含数据
            this.emit(eventName.NODE_CHILD_ADD,{ nodePath:path,childrenPath:addNode })
            //触发单独事件
            await Promise.all(addNode.map(async child => {
                const data = await this.wacherData(path,child)
                //触发单独的添加事件
                this.emit(eventName.CHILDNODE_ADD,{ nodePath:path,childPath:child,childData:data })
            }))
        }
        
        //已存在的子节点 进行数据更新
        await Promise.all(children.filter(child => !addNode.includes(child)).map(this.wacherData.bind(this,path))) 
    }

    /**
     * 监听一个 服务的子节点
     * @param nodePath 
     * @param child 
     */
    private async wacherData(nodePath: string, child: string){
        //已经取消监听了
        if(!this.nodes.has(nodePath)){ return }
        const childrenNode = this.nodes.get(nodePath)
        const currentChild = childrenNode?.get(child) || { data:null }

        const childPath = Path.join(nodePath,child)
        //获取数据 并且添加监听方法
        const data:string = await this.helper.getData(childPath,this.wacherData.bind(this,nodePath,child)) as string
        try{
            //转换对象
            const result = JSON.parse(data)
            //看看数据是否有改变 有改变就触发update事件
            if(data != JSON.stringify(currentChild.data)){
                //触发单独的添加事件
                this.emit(eventName.CHILDNODE_UPDATE,{ nodePath,childPath:child,prevChildData:currentChild.data,childData:result })
            }
            //更新本地数据
            childrenNode?.set(child,{ node:child,nodePath,data:result })

            return result
        }catch(err){}

        //JSON转换错误 直接返回null
        return null
    }


    /**
     * 获取下一次的服务地址
     * 如果没有可用的服务器 则返回null
     * @param path 
     */
    public getNextServer(path: string){
        const childNodeMap = this.nodes.get(path)
        const serverList = Array.from(childNodeMap?.values() || []).map(sender => {
            const { data } = sender
            return { address:`${data.ip}:${data.port}`,ip:data.ip,port:data.port,weight:data.weight }
        })
        if(!serverList || !Array.isArray(serverList) || serverList.length <= 0){  return null  }
        console.log(`当前的${path} serverList`,serverList)
        const balanceHelper = new WeightRoundRobin(serverList,1)
        const nextServerIP = balanceHelper.getAddress()
        return serverList.find(sender => sender.address == nextServerIP)
    }


    /**
     * 防抖 获取最新的服务器地址
     * @param serverPath 
     * @param listener 
     */
    private async listenerServer(serverPath: string, listener:Function){
        let resolve:Function | null,reject:Function | null
        const list = listener as any
        list.handler && clearTimeout(list.handler)
        list.handler = setTimeout(() => {
            const server = this.getNextServer(serverPath)
            listener(server)
            resolve && resolve(server)
            resolve = reject = null
        },3000)
        return new Promise((res,rej) => { resolve = res,reject = rej })
    }

    /**
     * 对外 监听服务 并且拿到最新的 服务器
     * @param params 
     * @param listener 
     */
    public async subscribe(params:subscibeConfig,listener:Function){
        const { systemName,serviceName } = params
        const serverPath = Path.join(systemName,serviceName)

        //进行节点监听 并且获取子节点数据
        await this.wacherNode(serverPath)

        //监听分发事件
        this.on(`${eventName.CHILDNODE_DELETE}:${serverPath}`,this.listenerServer.bind(this,serverPath,listener))
        this.on(`${eventName.CHILDNODE_ADD}:${serverPath}`,this.listenerServer.bind(this,serverPath,listener))
        //this.on(`${eventName.CHILDNODE_UPDATE}:${serverPath}`,this.listenerServer.bind(this,serverPath,listener))

        //当所有数据准备完毕之后 开始监听事件 以及计算权重获取服务节点
        return await this.listenerServer(serverPath,listener)
    }

    /**
     * 取消监听
     * @param params 
     * @param listener 
     */
    public async unSubscribe(params:subscibeConfig,listener?:Function){
        const { systemName,serviceName } = params
        const serverPath = Path.join(systemName,serviceName)
        this.removeAllListeners(`${eventName.CHILDNODE_DELETE}:${serverPath}`)
        this.removeAllListeners(`${eventName.CHILDNODE_ADD}:${serverPath}`)
        this.removeAllListeners(`${eventName.CHILDNODE_UPDATE}:${serverPath}`)
    }
}