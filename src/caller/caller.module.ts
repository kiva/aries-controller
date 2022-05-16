import { Module, HttpModule, DynamicModule } from '@nestjs/common';
import { MultiAgentCaller } from './multi.agent.caller';
import { SingleAgentCaller } from './single.agent.caller';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module';
import { CALLER } from './caller.interface';
import { ProfileModule } from '../profile/profile.module';

/**
 * Assembles the caller module based on whether we're configured for multi-agent or single-agent
 * The ControllerHandlerModule takes care of multi-controller vs single-controller
 */
 @Module({})
 export class CallerModule {
    static async registerAsync(): Promise<DynamicModule> {
        const agentCaller = (process.env.MULTI_AGENT === 'true') ? MultiAgentCaller : SingleAgentCaller;
        return {
            module: CallerModule,
            imports: [
                ControllerHandlerModule.registerAsync(),
                HttpModule,
                ProfileModule
            ],
            providers: [
                {
                    provide: CALLER,
                    useClass: agentCaller
                },
            ],
            exports: [
                CALLER
            ],
        };
    }
 }
