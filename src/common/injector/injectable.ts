/*
 * @Author: Johnny.xushaojia 
 * @Date: 2020-08-28 17:03:22 
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-08-29 16:27:01
 */
import 'reflect-metadata'
import { PROPERTY_DECORATOR, PARAM_DECORATOR, METHOD_DECORATOR, PARAM_TYPES, INJECTABLE_DECORATOR } from '../constan/constan'

/**
 * 帮助创建方法装饰器
 * @param options 
 */
export const createFunctionDecorator = function (options:{ propertyName?:string,factory?:Function,data?:any }){
    return (target: any, propertyName: string,propertyDescriptor: PropertyDescriptor) => {
        let methodParams = Reflect.getMetadata(METHOD_DECORATOR, target.constructor)
        //告诉当前是哪个属性
        options.propertyName = propertyName
        //必须是数组
        methodParams = Array.isArray(methodParams)? methodParams : []
        //添加一个新的属性描述
        methodParams.push(options)
        //重新写入
        Reflect.defineMetadata(METHOD_DECORATOR,methodParams,target.constructor)
        //返回
        return propertyDescriptor
    }
}

/**
 * 帮助创建属性装饰器
 * @param options 
 */
export const createPropertyDecorator = function (options:{ propertyName?:string,factory?:Function,data?:any }){
    return (target: any, propertyName: string) => {
        let propertyParams = Reflect.getMetadata(PROPERTY_DECORATOR, target.constructor)
        //告诉当前是哪个属性
        options.propertyName = propertyName
        //必须是数组
        propertyParams = Array.isArray(propertyParams)? propertyParams : []
        //添加一个新的属性描述
        propertyParams.push(options)
        //重新写入
        Reflect.defineMetadata(PROPERTY_DECORATOR,propertyParams,target.constructor)
    }
}

/**
 * 帮助创建参数装饰器
 * @param options 
 */
export const createParamDecorator = function (options:{ paramIndex?:number,methodName?:string,factory?:Function,data?:any,type?:any }){
    return (target:any, methodName: string, paramIndex: number) => {
        let params = Reflect.getMetadata(PARAM_DECORATOR, target.constructor)
        //拿到当前参数的类型
        let types = Reflect.getMetadata(PARAM_TYPES, target, methodName) || []
        //告诉是第几个参数
        options.paramIndex = paramIndex
        //告诉是什么方法名称
        options.methodName = methodName
        //告诉当前参数是什么类型
        options.type = types[paramIndex]
        //必须是数组
        params = Array.isArray(params)? params : []
        //添加一个新的属性描述
        params.push(options)
        //重新写入
        Reflect.defineMetadata(PARAM_DECORATOR,params,target.constructor)
    }
}

/**
 * 按照名称进行分类
 * @param paramList 
 * @param name 
 */
const classification = function(paramList:Array<any>,name:string){
    const map:Map<string,Array<any>> = new Map()
    paramList.forEach(sender => {
        const paramName = sender[name]
        let arr:Array<any> = map.get(paramName) || []
        arr.push(sender)
        map.set(paramName,arr)
    })
    return map
}

/**
 * 初始化类的属性
 * @param map 
 * @param target 
 */
const initProperty = function (map:Map<string,any>,target:any){
    const keyList = Array.from(map.keys())
    for(let name of keyList){
        const senderList = map.get(name)
        const sender = senderList.pop()
        //取最后一个生效 前面几个丢弃
        const { factory,data,propertyName } = sender
        let instance:any = null

        if(delete target.prototype[propertyName]){
            Object.defineProperty(target.prototype,propertyName,{
                get:function (){
                    //初始化 获取值
                    instance = instance || typeof data === "undefined"
                        ? (typeof factory === "function"? factory : () => { })(target,propertyName,sender)
                        : data
                    return instance
                },
                enumerable:true,
                configurable:true,
                //writable:true
            })
        }
    }
}

/**
 * 初始化类的方法
 * @param map 
 * @param target 
 */
const initMethod = function (map:Map<string,any>,target:any){
    const keyList = Array.from(map.keys())
    for(let name of keyList){
        const senderList = map.get(name)
        const senderFunc = target.prototype[name]
        let methodList:Function[]
        const createMethodList = function (){
            if(methodList){ return methodList }
            methodList = []
            senderList.forEach((sender:any) => {
                const { factory,data,propertyName } = sender
                const instance = typeof data === "undefined"
                    ? (typeof factory === "function"? factory : () => {})(target,propertyName,sender)
                    : data
                methodList.push(instance)
            })
            return methodList
        }
        //方法代理
        const proxyFunc = function (this: any, ...args:any[]){
            //返回执行原来的方法
            const result = typeof senderFunc === "function"? senderFunc.apply(this,args) : undefined
            //包装 一层一层执行
            return createMethodList().reduce((result,func) => {
                const nextResult = typeof func === "function" && func(result) || result
                return nextResult
            },result)
        }
        //挂载代理
        if(delete target.prototype[name]){
            Object.defineProperty(target.prototype,name,{
                get:() => proxyFunc,
                enumerable:true,
                configurable:true,
                //writable:true
            })
        }
    }
}

/**
 * 初始化参数装饰器
 * @param map 
 * @param target 
 */
const initParams = function (map:Map<string,any>,target:any){
    const keyList = Array.from(map.keys())
    for(let name of keyList){
        const senderList = map.get(name)
        const senderFunc = target.prototype[name]
        let paramsMap:Map<number,any>
        const craeteParamsMap = function (){
            if(paramsMap){ return paramsMap }
            paramsMap = new Map()
            senderList.forEach((sender:any) => {
                const { paramIndex,methodName,factory,data,type } = sender
                const instance = typeof data === "undefined"
                    ? (typeof factory === "function"? factory : () => {})(target,methodName,paramIndex,type,sender)
                    : data
                paramsMap.set(paramIndex,instance)
            })
            return paramsMap
        }
        //方法代理
        const proxyFunc = function (this: any, ...args:any[]){
            //替换参数
            craeteParamsMap().forEach((arg,index) => {
                args[index] = arg
            })
            //返回执行原来的方法
            return typeof senderFunc === "function"? senderFunc.apply(this,args) : undefined
        }
        if(delete target.prototype[name]){
            Object.defineProperty(target.prototype,name,{
                get:() => proxyFunc,
                enumerable:true,
                configurable:true,
                //writable:true
            })
        }
    }
}




/**
 * 装饰  可以被inject的
 */
export const Injectable = function (){
    return function (target:Function){
        const constructor = target.prototype.constructor
        const types = Reflect.getMetadata(PARAM_TYPES, constructor)
        Reflect.defineMetadata(INJECTABLE_DECORATOR,{
            constructorTypes:types
        },target)
    }
}

type constructor = new (...args:any[]) => any
type useFactoryParams = { useFactory:(...args:any[]) => any,inject?:any[],provide:any }
type useClassParams = { useClass:constructor,provide:any }
type useValueParams = { useValue:any,provide:any }

export const IsInjectable = function (craetor:new (...args:any[]) => any){
    const injectParams = Reflect.getMetadata(INJECTABLE_DECORATOR, craetor)
    return !!(injectParams && Array.isArray(injectParams.constructorTypes))
}

export class Factory{
    private static craetorInstanceMap:Map<any,any> = new Map()
    private constructor(){}

    /**
     * 替换一个已存在的对象
     * @param params 
     */
    static replaceValue<TOutput = any>(params:useValueParams){
        if(Factory.craetorInstanceMap.has(params.provide)){
            Factory.craetorInstanceMap.set(params.provide,params.useValue)
        }
        return Factory.craetorInstanceMap.get(params.provide) as TOutput
    }

    /**
     * 清除一个对象
     * @param params 
     */
    static clearValue(provide:any){
        return Factory.craetorInstanceMap.delete(provide)
    }

    /**
     * 如果对象已经被注入过 则直接返回对象
     * @param provide 
     */
    static getValue(provide:any){
        return Factory.craetorInstanceMap.get(provide)
    }

    /**
     * 直接创建一个对象
     * @param params 
     */
    static useValue<TOutput = any>(params:useValueParams){
        const { useValue,provide } = params
        //如果已经实例化过 则直接返回
        if(Factory.craetorInstanceMap.has(provide)){  return Factory.craetorInstanceMap.get(provide) }
        Factory.craetorInstanceMap.set(provide,useValue)
        return useValue as TOutput
    }
    /**
     * 根据 useClass 创建一个对象
     * @param params 
     */
    static async useClass<TOutput = any>(params:useClassParams){
        const { useClass:creator,provide } = params
        //如果已经实例化过 则直接返回
        if(Factory.craetorInstanceMap.has(provide)){  return Factory.craetorInstanceMap.get(provide) }
        const constructor = creator.prototype.constructor
        //没有被@Injectable的 无法拿到构造参数
        if(!IsInjectable(creator.prototype.constructor)){ throw new Error(`请在${creator.name}定义的时候加上 @Injectable()`) }
        //拿到构造参数
        const injectorTypes = Reflect.getMetadata(PARAM_TYPES, constructor)
        //返回创建
        return await Factory.create(injectorTypes,creator,provide) as TOutput
    }
    /**
     * 根据 useFactory 创建一个对象
     * @param params 
     */
    static async useFactory<TOutput = any>(params:useFactoryParams){
        const constructor = params.useFactory.prototype && params.useFactory.prototype.constructor || params.useFactory
        return await Factory.create(params.inject || [],constructor,params.provide) as TOutput
    }

    /**
     * 创建一个对象
     * @param constructorTypes 
     * @param creator 
     * @param dirName 
     */
    static async create<TOutput = any>(injectors:any[],creator:constructor | Function,dirName?:any){
        //字典
        dirName = dirName || creator
        //如果已经实例化过 则直接返回
        if(Factory.craetorInstanceMap.has(dirName)){ return Factory.craetorInstanceMap.get(dirName) }

        /*----- 构建 -----*/
        //参数装饰器
        const params = Reflect.getMetadata(PARAM_DECORATOR, creator) || []
        //初始化 参数装饰器
        initParams(classification(params,"methodName"),creator)

        //属性装饰器
        const propertyParams = Reflect.getMetadata(PROPERTY_DECORATOR, creator) || []
        //初始化 属性装饰器
        initProperty(classification(propertyParams,"propertyName"),creator)

        //方法装饰器
        const methodParams = Reflect.getMetadata(METHOD_DECORATOR, creator) || []
        //初始化 方法装饰器
        initMethod(classification(methodParams,"propertyName"),creator)
        /*----- 构建 -----*/
        
        //创建实例
        //比如creator传递进来的是useFactory factory返回的实例进行缓存
        let instance:unknown
        //判断是否是constructor
        if(creator.prototype && creator.prototype.constructor == creator){
            const constructor = creator as constructor
            instance = new constructor(...await Promise.all(injectors.map((type:any) => Factory.createConstructor(type))))
        }else{
            const useFactory = creator as Function
            instance = await useFactory(...await Promise.all(injectors.map((type:any) => Factory.createConstructor(type))))
        }
        //把他放入实例队列中
        Factory.craetorInstanceMap.set(dirName,instance)
        //返回实例
        return instance as TOutput
    }

    /**
     * 根据constructor创建对象 
     * @param creator 
     */
    static async createConstructor<TOutput = any>(creator:constructor | any){
        //如果已经实例化过 则直接返回
        if(Factory.craetorInstanceMap.has(creator)){ return Factory.craetorInstanceMap.get(creator) }
        const constructor = creator.prototype.constructor
        if(!IsInjectable(creator.prototype.constructor)){ throw new Error(`请在${creator.name}定义的时候加上 @Injectable()`) }
        //拿到构造参数
        const injectorTypes = Reflect.getMetadata(PARAM_TYPES, constructor)
        //创建对象
        return await Factory.create(injectorTypes,creator,creator) as TOutput
    }
}