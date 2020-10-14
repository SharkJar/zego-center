/*
 * @Author: Johnny.xushaojia 
 * @Date: 2020-09-14 18:06:16 
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-10-14 16:44:24
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
