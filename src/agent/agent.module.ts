import { Module } from '@nestjs/common';
import { AgentService } from './agent.service.js';
import { AgentController } from './agent.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { CallerModule } from '../caller/caller.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module.js';

/**
 *
 */
@Module({
    imports: [
        GlobalCacheModule,
        CallerModule.registerAsync(),
        ControllerHandlerModule.registerAsync(),
        ProfileModule
    ],
    controllers: [
        AgentController
    ],
    providers: [
        AgentService,
    ],
    exports: [
        AgentService,
    ]
})
export class AgentModule {}
