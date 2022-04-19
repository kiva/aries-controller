import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { CallerModule } from '../caller/caller.module';
import { ProfileModule } from '../profile/profile.module';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module';
import { HttpModule } from '@nestjs/axios';

/**
 *
 */
@Module({
    imports: [
        HttpModule,
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
