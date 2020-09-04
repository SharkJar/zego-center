import { ConfigParamDecorator, ConfigPropertyDecorator } from './common/config/configService';
import { Injectable, Factory, createFunctionDecorator } from './common/injector/injectable';
import { ConfigService, ConfigManage } from './common/config/configService';
import { CenterService } from './Provider/server';
import * as Path from 'path';
import { CenterClient } from './Consumer/client';

(async function Bootstrap() {
  await Factory.useFactory({
    provide: ConfigService,
    async useFactory() {
      return ConfigManage.craete(Path.join(__dirname, `./config/${process.env.NODE_ENV || 'production'}.env`));
    },
  });

  const client: CenterClient = await Factory.createConstructor<CenterClient>(CenterClient);

  await client.subscribe(
    {
      serviceName: 'user-center',
      systemName: '/test-zk',
    },
    (server: any) => console.log('最新服务器', server),
  );

  const instance: CenterService = await Factory.createConstructor<CenterService>(CenterService);
  await instance.register({
    serviceName: 'user-center',
    serverIP: '127.0.0.1',
    serverPort: 80,
    systemName: '/test-zk',
  });
  await instance.register({
    serviceName: 'user-center',
    serverIP: '127.0.0.1',
    serverPort: 8080,
    systemName: '/test-zk',
  });
  await instance.register({
    serviceName: 'user-center',
    serverIP: '127.0.0.1',
    serverPort: 8081,
    systemName: '/test-zk',
  });
})();

// @Injectable()
// class b{
//     constructor(private config:ConfigService){
//         console.log(config,"constructor")
//     }
// }

// const methodDecorator = function (){
//     return createFunctionDecorator({
//         data(result:any){ return `我是methodDecorator 本来的find返回的值:${result}. 我被代理了` }
//     })
// }

// const methodDecorator1 = function (){
//     return createFunctionDecorator({
//         data(result:any){ return `我是methodDecorator1 本来的methodDecorator返回的值:${result}. 我被代理了` }
//     })
// }

// const methodDecorator2 = function (){
//     return createFunctionDecorator({
//         data(result:any){ return `我是methodDecorator2 本来的methodDecorator1返回的值:${result}. 我被代理了` }
//     })
// }

// @Injectable()
// class a{
//     constructor(private classB:b){
//         console.log("constructor classB:",classB)
//     }

//     @methodDecorator2()
//     @methodDecorator1()
//     @methodDecorator()
//     find(
//         @ConfigParamDecorator("")
//         a:string,
//         b:number,
//         @ConfigParamDecorator("")
//         c:string
//     ):string{
//         console.log("find 方法:",a,b,c)
//         return "find result"
//     }

//     @ConfigPropertyDecorator("")
//     ksdfsdfkj:any
// }

// Factory.createConstructor(a).then(instance => {
//     console.log("ksdfsdfkj属性:",instance.ksdfsdfkj,instance.find("1m1",2,""))
// })
