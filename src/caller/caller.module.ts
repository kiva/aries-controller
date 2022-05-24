import { Module, DynamicModule } from '@nestjs/common';
import { MultiAgentCaller } from './multi.agent.caller.js';
import { SingleAgentCaller } from './single.agent.caller.js';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module.js';
import { CALLER } from './caller.interface.js';
import { ProfileModule } from '../profile/profile.module.js';
import { ProtocolHttpModule } from 'protocol-common';

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
                ProtocolHttpModule,
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
