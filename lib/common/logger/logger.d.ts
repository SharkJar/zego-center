import { Logger as Log4 } from 'log4js';
import { ConfigService } from 'zego-config';
export declare class BusinessLogger {
    private config;
    context?: string;
    logger: Log4;
    constructor(config: ConfigService);
    error(message: any, trace?: string, context?: string): void;
    log(message: any, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
    setContext(context: string): void;
}
