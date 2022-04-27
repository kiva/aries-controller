import { Module } from '@nestjs/common';
import { AgentControllerService } from './agent.controller.service.js';
import { AgentControllerController } from './agent.controller.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { AgentGovernanceFactory } from './agent.governance.factory.js';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { ProtocolHttpModule } from 'protocol-common';

/**
 * The controller module for our agency, handles all the callbacks and webhooks from our agents
 */
@Module({
    imports: [
        ProtocolHttpModule,
        GlobalCacheModule,
        ControllerHandlerModule.registerAsync(),
        ProfileModule,
    ],
    controllers: [AgentControllerController],
    providers: [AgentControllerService, AgentGovernanceFactory],
})
export class AgentControllerModule {}
