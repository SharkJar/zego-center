/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-09-14 18:06:16
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-11-03 15:20:13
 */
import { CenterService } from './Provider/server';
import { CenterClient } from './Consumer/client';
import { BusinessLogger } from './common/logger/logger';
import { ConfigService, ConfigManage } from 'zego-config';
import { Factory } from 'zego-injector';
import * as Path from 'path';

export class CenterServer {
  private constructor() {}

  private static initConfig(config?: any) {
    const injector =
      config == null || !('get' in config)
        ? ConfigManage.craete(Path.join(__dirname, `./config/${process.env.NODE_ENV || 'production'}.env`))
        : config;
    Factory.useFactory({
      provide: ConfigService,
      useFactory: () => injector,
    });
  }
  private static initLogger(logger?: any) {
    if (logger == null || !('log' in logger)) {
      return;
    }
    Factory.useReplace({
      provide: BusinessLogger,
      useFactory: () => logger,
    });
  }
  /**
   * 创建服务端注册
   * @param config
   * @param logger
   */
  public static createService(config?: any, logger?: any): CenterService {
    CenterServer.initConfig(config);
    CenterServer.initLogger(logger);
    return Factory.create<CenterService>(CenterService);
  }

  /**
   * 创建客户端注册
   * @param config
   * @param logger
   */
  public static createClient(config?: any, logger?: any): CenterClient {
    CenterServer.initConfig(config);
    CenterServer.initLogger(logger);
    return Factory.create<CenterClient>(CenterClient);
  }
}

const config = new Map();
config.set('SERVERS', '192.168.100.72:2181');
config.set('SESSIONTIMEOUT', '30000');
config.set('SPINDELAY', '1000');
config.set('RETRIES', '0');
config.set('LOGGERROOT', './nest-log');
let logger: any = {
  log(logText: any) {
    console.log(logText);
  },
};
const service = CenterServer.createService(config, logger);
setTimeout(() => {
  service.register({
    serviceName: 'user-center-v2',
    serverIP: '127.0.0.1',
    serverPort: 80,
    systemName: '/test-zk-v2',
  });
}, 10000);

const client = CenterServer.createClient(config, logger);
client.subscribe(
  {
    serviceName: 'user-center-v2',
    systemName: '/test-zk-v2',
  },
  (server: any) => {
    console.log('最后数据回调', server);
  },
  true,
);
