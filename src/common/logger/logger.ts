/*
 * @Author: Johnny.xushaojia
 * @Date: 2020-08-28 17:03:40
 * @Last Modified by: Johnny.xushaojia
 * @Last Modified time: 2020-08-29 16:12:35
 */
import { configure, Log4js, Logger as Log4 } from 'log4js';
import { ConfigService } from '../config/configService';
import { Injectable } from '../injector/injectable';

const loggerName = 'zookeeper-helper-sdk';
let log4Instance!: Log4js;
const getLog4Instance = function (baseDir?: string): Log4js {
  //已经被实例过 就不在实例了
  if (log4Instance != null) {
    return log4Instance;
  }
  //给定一个默认值
  baseDir = baseDir && baseDir.trim().length > 0 ? baseDir : './nestjs-log';
  //log4js 配置
  return (log4Instance = configure({
    appenders: {
      //默认日志
      default: {
        type: 'dateFile',
        filename: `${baseDir}/${loggerName}`,
        level: 'all',
        pattern: 'yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        daysToKeep: 7,
      },
    },
    categories: {
      default: { appenders: ['default'], level: 'all' },
      loggerName: { appenders: ['default'], level: 'all' },
    },
  }));
};

@Injectable()
export class BusinessLogger {
  context?: string = loggerName;
  logger: Log4;

  constructor(private config: ConfigService) {
    //配置基础配置
    this.logger = getLog4Instance(config.get<string>('LOGGERROOT')).getLogger(this.context);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(`[${context || this.context}]  ` + message);
  }

  log(message: any, context?: string) {
    this.logger.info(`[${context || this.context}]  ` + message);
  }

  warn(message: any, context?: string) {
    this.logger.warn(`[${context || this.context}]  ` + message);
  }

  debug(message: any, context?: string) {
    this.logger.debug(`[${context || this.context}]  ` + message);
  }

  verbose(message: any, context?: string) {
    this.logger.info(`[${context || this.context}]  ` + message);
  }

  setContext(context: string) {
    this.context = context;
  }
}
