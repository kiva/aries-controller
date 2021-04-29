import { Module, HttpModule, DynamicModule } from '@nestjs/common';
import { MultiAgentCaller } from './multi.agent.caller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { SingleAgentCaller } from './single.agent.caller';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module';

/**
 *
 */
 @Module({})
 export class CallerModule {
    static async registerAsync(): Promise<DynamicModule> {
        const multiAgent = (process.env.MULTI_AGENT === 'true');
        const agentCaller = multiAgent ? MultiAgentCaller : SingleAgentCaller;
        return {
            module: CallerModule,
            imports: [
                ControllerHandlerModule.registerAsync(),
                GlobalCacheModule,
                HttpModule,
            ],
            providers: [
                {
                    provide: 'CALLER',
                    useClass: agentCaller
                },
            ],
            exports: [
                'CALLER'
            ],
        };
    }
 }
