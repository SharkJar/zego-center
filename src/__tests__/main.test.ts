import { CenterServer } from '../index'
import { CenterClient } from '../Consumer/client'
import { CenterService } from '../Provider/server'


const config = new Map()
let logger:any = { log(logText:any){ console.log(logText) } }
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


  it("CenterService",async () => {
    service = CenterServer.createService(config,logger)

    await service.register({
      serviceName: 'user-center-v2',
      serverIP: '127.0.0.1',
      serverPort: 80,
      systemName: '/test-zk-v2'
    });
    expect(service).not.toBeNull()
  })
  
  it('CenterClient',async () => {
    client = CenterServer.createClient(config,logger)
    await client.subscribe(
      {
        serviceName: 'user-center-v2',
        systemName: '/test-zk-v2',
      },
      (server: any) => console.log(server),
    );

    expect(client).not.toBeNull()
  })

  

})


// afterAll(async done => {
//   service.stopNextTick()
//   done();
// });