import { Module } from '@nestjs/common';
import { IssuerService } from './issuer.service.js';
import { IssuerController } from './issuer.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { AgentService } from '../agent/agent.service.js';
import { CallerModule } from '../caller/caller.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { ControllerHandlerModule } from '../controller.handler/controller.handler.module.js';
import { ProtocolHttpModule } from 'protocol-common';

/**
 *
 */
@Module({
    imports: [
        ProtocolHttpModule,
        GlobalCacheModule,
        CallerModule.registerAsync(),
        ControllerHandlerModule.registerAsync(),
        ProfileModule,
    ],
    controllers: [IssuerController],
    providers: [
        IssuerService,
        AgentService,
    ],
    exports: [
        IssuerService,
        AgentService
    ]
})
export class IssuerModule {}
