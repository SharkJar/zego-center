import { ZkHelper } from '../common/zookeeper/zk.helper';
import { ConfigService } from 'zego-config';
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
    private systemWeiget;
    private systemState;
    constructor(helper: ZkHelper, config: ConfigService, logger: BusinessLogger);
    isNeedBreakZK(cpu: number, avg5: number, avg15: number, heap: number): boolean;
    private isBreakZk;
    private intervalSystemState;
    private intervalSystemWeight;
    private nextTick;
    register(params: registerConfig): Promise<any>;
    unregister(params: registerConfig): Promise<any>;
    private registerZK;
    private unRegisterZK;
}
export {};
