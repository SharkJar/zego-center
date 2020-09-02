/// <reference types="node" />
import { ZkHelper } from '../common/zookeeper/zk.helper';
import { ConfigService } from '../common/config/configService';
import * as Event from 'events';
import { BusinessLogger } from '../common/logger/logger';
declare type subscibeConfig = {
    systemName: string;
    serviceName: string;
};
export declare class CenterClient extends Event.EventEmitter {
    private helper;
    private config;
    private logger;
    [name: string]: any;
    private nodes;
    constructor(helper: ZkHelper, config: ConfigService, logger: BusinessLogger);
    private distributionEvent;
    private wacherNode;
    private wacherData;
    getNextServer(path: string): {
        address: string;
        ip: string;
        port: number;
        weight: number;
    } | null | undefined;
    private listenerServer;
    subscribe(params: subscibeConfig, listener: Function): Promise<unknown>;
    unSubscribe(params: subscibeConfig, listener?: Function): Promise<void>;
}
export {};
