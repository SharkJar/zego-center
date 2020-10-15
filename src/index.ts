/*
 * @Author: Johnny.xushaojia 
 * @Date: 2020-09-14 18:06:16 
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-10-15 15:16:56
 */
import { CenterService } from './Provider/server'
import { CenterClient } from './Consumer/client'
import { BusinessLogger } from './common/logger/logger';
import { ConfigService, ConfigManage } from 'zego-config';
import { Factory } from 'zego-injector';
import * as Path from 'path'


export class CenterServer{
    private constructor(){}


    private static initConfig(config?:any){
        const injector = config == null || !("get" in config)
            ? ConfigManage.craete(Path.join(__dirname, `./config/${process.env.NODE_ENV || 'production'}.env`))
            : config
        Factory.useFactory({
            provide:ConfigService,
            useFactory:() => injector
        })
    }
    private static initLogger(logger?:any){
        if(logger == null || !("log" in logger)){ return }
        Factory.useReplace({
            provide:BusinessLogger,
            useFactory:() => logger
        })
    }
    /**
     * 创建服务端注册
     * @param config 
     * @param logger 
     */
    public static createService(config?:any ,logger?: any): CenterService{
        CenterServer.initConfig(config)
        CenterServer.initLogger(logger)
        return Factory.create<CenterService>(CenterService);
    }

    /**
     * 创建客户端注册
     * @param config 
     * @param logger 
     */
    public static createClient(config?:any ,logger?: any): CenterClient{
        CenterServer.initConfig(config)
        CenterServer.initLogger(logger)
        return Factory.create<CenterClient>(CenterClient);
    }
}



(async function (){
    const config = new Map()
    let logger:any = { log(logText:any){ console.log(logText) } }
    config.set("SERVERS","192.168.100.72:2181,192.168.100.62:2181")
    config.set("SESSIONTIMEOUT","30000")
    config.set("SPINDELAY","1000")
    config.set("RETRIES","0")
    config.set("LOGGERROOT","./nest-log")
    const client = CenterServer.createClient(config,logger)

    client.subscribe({
        systemName:"/zego-center",
        serviceName:"abc"
    },(server:any) => {
        console.log("server:",server)
    })
})()