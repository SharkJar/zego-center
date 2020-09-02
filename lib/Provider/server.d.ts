import { ZkHelper } from '../common/zookeeper/zk.helper';
import { ConfigService } from '../common/config/configService';
import { BusinessLogger } from '../common/logger/logger';
declare type registerConfig = {
    systemName: string;
    serviceName: string;
    serverIP: string;
    serverPort: number;
    weight?: number;
};
export declare class CenterService {
    private helper;
    private config;
    private logger;
    private liveHeadTask;
    private nextHandler;
    constructor(helper: ZkHelper, config: ConfigService, logger: BusinessLogger);
    private isBreakZk;
    private nextTick;
    register(params: registerConfig): Promise<unknown>;
    unregister(params: registerConfig): Promise<unknown>;
    private registerZK;
    private unRegisterZK;
}
export {};
