import { Module } from '@nestjs/common';
import { AgentControllerService } from './agent.controller.service';
import { AgentControllerController } from './agent.controller.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { AgentGovernanceFactory } from './agent.governance.factory';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module';
import { ProfileModule } from '../profile/profile.module';
import { HttpModule } from '@nestjs/axios';

/**
 * The controller module for our agency, handles all the callbacks and webhooks from our agents
 */
@Module({
    imports: [
        HttpModule,
        GlobalCacheModule,
        ControllerHandlerModule.registerAsync(),
        ProfileModule,
    ],
    controllers: [AgentControllerController],
    providers: [AgentControllerService, AgentGovernanceFactory],
})
export class AgentControllerModule {}
