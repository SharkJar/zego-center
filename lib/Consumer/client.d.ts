/// <reference types="node" />
import { ZkHelper } from '../common/zookeeper/zk.helper';
import { ConfigService } from 'zego-config';
import * as Event from 'events';
import { BusinessLogger } from '../common/logger/logger';
import { Subject, Subscription } from 'rxjs';
declare type subscibeConfig = {
    systemName: string;
    serviceName: string;
    isNeedWacherWeight?: boolean;
};
export declare class CenterClient extends Event.EventEmitter {
    private helper;
    private config;
    private logger;
    [name: string]: any;
    private nodes;
    constructor(helper: ZkHelper, config: ConfigService, logger: BusinessLogger);
    private distributionEvent;
    subscribe(params: subscibeConfig, listener: Function | Subject<any>, isNeedWacherWeight?: boolean): void;
    getNextServer(serverPath: string): {
        address: string;
        ip: string;
        port: number;
        weight: number;
    } | null | undefined;
    unSubscribe(params: subscibeConfig, listener?: Function): void;
    unsunscribeNode(nodePath: string): void;
    unsubscribeData(nodePath: string, child: string): void;
    subscribeWacherData(path: string, child: string): Subscription | undefined;
    subscribeWacherNode(path: string): Subscription | undefined;
    private wacherData;
    private wacherNode;
}
export {};
