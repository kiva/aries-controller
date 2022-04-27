import { Module, DynamicModule } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { MultiControllerHandler } from './multi.controller.handler.js';
import { SingleControllerHandler } from './single.controller.handler.js';
import { CONTROLLER_HANDLER } from './controller.handler.interface.js';
import { AgentContext } from '../utility/agent.context.js';
import { SecretsManager } from '../profile/secrets.manager.js';

/**
 * Assembles the controller handler module based on single-controller multi-controller
 */
 @Module({})
 export class ControllerHandlerModule {
    static async registerAsync(): Promise<DynamicModule> {
        const controllerHandler = (process.env.MULTI_CONTROLLER === 'true') ? MultiControllerHandler : SingleControllerHandler;
        return {
            module: ControllerHandlerModule,
            imports: [
                GlobalCacheModule,
                ProfileModule,
            ],
            providers: [
                SecretsManager,
                AgentContext,
                {
                    provide: CONTROLLER_HANDLER,
                    useClass: controllerHandler
                }
            ],
            exports: [
                CONTROLLER_HANDLER
            ],
        };
    }
 }
