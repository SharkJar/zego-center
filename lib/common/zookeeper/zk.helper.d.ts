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
    private callLib;
    private hasConnect;
    private createPromise;
    private connect;
    getState(): any;
    createServer(): any;
    private getLib;
    setACL(path: string, acls?: any[], version?: number): Promise<any>;
    getACL(path: string): Promise<any>;
    listSubTreeBFS(path: string): Promise<any>;
    getChildren(path: string, watcher?: Function): Promise<any>;
    mkdirp(path: string, data?: string, acls?: any[], mode?: number): Promise<any>;
    create(path: string, data?: string, acls?: any[], mode?: number): Promise<any>;
    remove(path: string, version?: number): Promise<any>;
    exists(path: string, watcher?: Function): Promise<any>;
    setData(path: string, data?: string, version?: number): Promise<any>;
    getData(path: string, watcher?: Function): Promise<unknown>;
    private listener;
    close(): void;
}
