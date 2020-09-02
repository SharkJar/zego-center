/*
 * @Author: Johnny.xushaojia 
 * @Date: 2020-08-26 14:42:06 
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-08-29 16:44:20
 */
import 'reflect-metadata'
import * as dotenv from 'dotenv'
import { createPropertyDecorator, createParamDecorator } from '../injector/injectable'

export class ConfigService{
    private config:Map<string,unknown> = new Map()
    constructor(private dotenv:{ parsed?:any } = {}){
        this.mergeMap(dotenv)
    }

    /**
     * 合并config 先后顺序会覆盖
     * @param dotenv 
     */
    public mergeMap(dotenv:{ parsed?:any } = {}){
        const { parsed = {} } = dotenv
        Object.keys(parsed).reduce((map,key) => {
            map.set(key,parsed[key])
            return map
        },this.config)
    }

    /**
     * 获取值
     * @param key 
     */
    public get<Toutput = any>(key:string){
        return this.config.get(key) as Toutput
    }

    /**
     * 是否存在
     * @param key 
     */
    public has(key:string){
        return this.config.has(key)
    }

    /**
     * 删除值
     * @param key 
     */
    public delete(key:string){
        return this.config.delete(key)
    }

    /**
     * toObject化 把map转换为object
     */
    public valueOf(){
        return Array.from(this.config.keys()).reduce((sender:any,currentKey:string) => {
            sender[currentKey] = this.config.get(currentKey)
            return sender
        },{ })
    }
}


export class ConfigManage{
    private static config:ConfigService = new ConfigService()
    private constructor(){}

    static craete(configPath:string | string[] | null): any{
        //直接返回
        if(!configPath){ return ConfigManage.config }
        //数组结构
        configPath = typeof configPath === "string"? [configPath] : configPath
        //解析之后返回config
        return configPath.reduce((config,path) => {
            const env = dotenv.config({ path,encoding:"utf8" })
            config.mergeMap(env)
            return config
        },ConfigManage.config)
    }

    static get(key:string){
        return ConfigManage.config.get(key)
    }

    static has(key:string){
        return ConfigManage.config.has(key)
    }

    static toObject(){
        return ConfigManage.config.valueOf()
    }
}

/**
 * 属性装饰器
 * @param configPath  
 */
export const ConfigPropertyDecorator = function (configPath:string){
    return createPropertyDecorator({
        factory(){ return ConfigManage.craete(configPath) }
    })
}

/**
 * 参数装饰器
 * @param configPath 
 */
export const ConfigParamDecorator = function (configPath:string){
    return createParamDecorator({
        factory(){ return ConfigManage.craete(configPath) }
    })
}


