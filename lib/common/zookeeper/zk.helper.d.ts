import { ACL } from 'node-zookeeper-client';
import { BusinessLogger } from '../logger/logger';
import { ConfigService } from 'zego-config';
export declare const ACLS: {
    OPEN_ACL_UNSAFE: ACL[];
    CREATOR_ALL_ACL: ACL[];
    READ_ACL_UNSAFE: ACL[];
};
export declare class ZkHelper {
    private logger;
    private config;
    [name: string]: any;
    private client;
    constructor(logger: BusinessLogger, config: ConfigService);
    private initConstructor;
    private getUseMethodNames;
    private hasConnect;
    getState(): any;
    setACL(path: string, acls?: any[], version?: number): Promise<unknown>;
    getACL(path: string): Promise<unknown>;
    listSubTreeBFS(path: string): Promise<unknown>;
    getChildren(path: string, watcher?: Function): Promise<unknown>;
    mkdirp(path: string, data?: string, acls?: any[], mode?: number): Promise<unknown>;
    create(path: string, data?: string, acls?: any[], mode?: number): Promise<unknown>;
    remove(path: string, version?: number): Promise<unknown>;
    exists(path: string, watcher?: Function): Promise<boolean>;
    setData(path: string, data?: string, version?: number): Promise<unknown>;
    getData(path: string, watcher?: Function): Promise<unknown>;
    private listener;
    createServer(): any;
    connect(): Promise<unknown>;
    close(): void;
}
