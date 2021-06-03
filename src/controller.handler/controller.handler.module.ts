import { Module, DynamicModule } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { GlobalCacheModule } from '../app/global.cache.module';
import { MultiControllerHandler } from '../controller.handler/multi.controller.handler';
import { SingleControllerHandler } from '../controller.handler/single.controller.handler';
import { ProfileManager } from '../profile/profile.manager';
import { CONTROLLER_HANDLER } from './controller.handler.interface';
import { AgentContext } from '../utility/agent.context';

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
                ProfileManager,
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