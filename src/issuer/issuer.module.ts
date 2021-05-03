import { Module, HttpModule } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { AgentService } from '../agent/agent.service';
import { CallerModule } from '../caller/caller.module';
import { ProfileModule } from '../profile/profile.module';

/**
 *
 */
@Module({
    imports: [
        HttpModule,
        GlobalCacheModule,
        CallerModule.registerAsync(),
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
