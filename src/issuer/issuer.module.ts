import { Module } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { AgentService } from '../agent/agent.service';
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
