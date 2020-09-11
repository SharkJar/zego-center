import { CenterService } from './Provider/server';
import { CenterClient } from './Consumer/client';
export declare class CenterServer {
    private constructor();
    private static initConfig;
    private static initLogger;
    static createService(config?: any, logger?: any): CenterService;
    static createClient(config?: any, logger?: any): CenterClient;
}
