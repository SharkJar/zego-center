import 'reflect-metadata';
export declare class ConfigService {
    private dotenv;
    private config;
    constructor(dotenv?: {
        parsed?: any;
    });
    mergeMap(dotenv?: {
        parsed?: any;
    }): void;
    get<Toutput = any>(key: string): Toutput;
    has(key: string): boolean;
    delete(key: string): boolean;
    valueOf(): any;
}
export declare class ConfigManage {
    private static config;
    private constructor();
    static craete(configPath: string | string[] | null): any;
    static get(key: string): any;
    static has(key: string): boolean;
    static toObject(): any;
}
export declare const ConfigPropertyDecorator: (configPath: string) => (target: any, propertyName: string) => void;
export declare const ConfigParamDecorator: (configPath: string) => (target: any, methodName: string, paramIndex: number) => void;
