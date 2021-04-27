import { Module, HttpModule, DynamicModule } from '@nestjs/common';
import { MultiAgentCaller } from './multi.agent.caller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { SingleAgentCaller } from './single.agent.caller';

/**
 *
 */
 @Module({})
 export class CallerModule {
     static async registerAsync(): Promise<DynamicModule> {
         const multiController = (process.env.MULTI_CONTROLLER === 'true');
         const multiAgent = (process.env.MULTI_AGENT === 'true');
         if (multiAgent) {
            return {
                module: CallerModule,
                imports: [ 
                    GlobalCacheModule,
                    HttpModule,
                ],
                providers: [
                    {
                        provide: 'CALLER',
                        useClass: MultiAgentCaller
                    }
                ],
                exports: [
                    'CALLER'
                ],
            };
         } else {
            return {
                module: CallerModule,
                imports: [ 
                    HttpModule 
                ],
                providers: [
                    {
                        provide: 'CALLER',
                        useClass: SingleAgentCaller
                    }
                ],
                exports: [
                    'CALLER'
                ],
            };
         }
       }
 }
