import 'reflect-metadata';
export declare const createFunctionDecorator: (options: {
    propertyName?: string;
    factory?: Function;
    data?: any;
}) => (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const createPropertyDecorator: (options: {
    propertyName?: string;
    factory?: Function;
    data?: any;
}) => (target: any, propertyName: string) => void;
export declare const createParamDecorator: (options: {
    paramIndex?: number;
    methodName?: string;
    factory?: Function;
    data?: any;
    type?: any;
}) => (target: any, methodName: string, paramIndex: number) => void;
export declare const Injectable: () => (target: Function) => void;
declare type constructor = new (...args: any[]) => any;
declare type useFactoryParams = {
    useFactory: (...args: any[]) => any;
    inject?: any[];
    provide: any;
};
declare type useClassParams = {
    useClass: constructor;
    provide: any;
};
declare type useValueParams = {
    useValue: any;
    provide: any;
};
export declare const IsInjectable: (craetor: new (...args: any[]) => any) => boolean;
export declare class Factory {
    private static craetorInstanceMap;
    private constructor();
    static replaceValue<TOutput = any>(params: useValueParams): TOutput;
    static clearValue(provide: any): boolean;
    static getValue(provide: any): any;
    static useValue<TOutput = any>(params: useValueParams): any;
    static useClass<TOutput = any>(params: useClassParams): Promise<any>;
    static useFactory<TOutput = any>(params: useFactoryParams): Promise<TOutput>;
    static create<TOutput = any>(injectors: any[], creator: constructor | Function, dirName?: any): Promise<any>;
    static createConstructor<TOutput = any>(creator: constructor | any): Promise<any>;
}
export {};
