import { CenterServer } from '../index'
import { CenterClient } from '../Consumer/client'
import { CenterService } from '../Provider/server'


const config = new Map()
let logger:any = { log(logText:any){ } }
let client!:CenterClient
let service!:CenterService

describe('Injector test', () => {


  beforeEach(async () => {
    config.set("SERVERS","192.168.100.72:2181,192.168.100.62:2181")
    config.set("SESSIONTIMEOUT","30000")
    config.set("SPINDELAY","1000")
    config.set("RETRIES","0")
    config.set("LOGGERROOT","./nest-log")
  })

  it('CenterClient',async () => {
    client = CenterServer.createClient(config,logger)
    await client.subscribe(
      {
        serviceName: 'user-center',
        systemName: '/test-zk',
      },
      (server: any) => console.log(server),
    );

    expect(client).not.toBeNull()
  })

  it("CenterService",async () => {
    service = CenterServer.createService(config,logger)
    await service.register({
      serviceName: 'user-center',
      serverIP: '127.0.0.1',
      serverPort: 80,
      systemName: '/test-zk',
    });
    await service.register({
      serviceName: 'user-center',
      serverIP: '127.0.0.1',
      serverPort: 8080,
      systemName: '/test-zk',
    });
    await service.register({
      serviceName: 'user-center',
      serverIP: '127.0.0.1',
      serverPort: 8081,
      systemName: '/test-zk',
    });
    expect(service).not.toBeNull()
  })

})


afterAll(async done => {
  service.stopNextTick()
  done();
});