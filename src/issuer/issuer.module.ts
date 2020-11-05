import { Module, HttpModule } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { AgentCaller } from '../agent/agent.caller';
import { AgentService } from '../agent/agent.service';

/**
 *
 */
@Module({
    imports: [
        HttpModule,
        GlobalCacheModule,
    ],
    controllers: [IssuerController],
    providers: [
        IssuerService,
        AgentService,
        AgentCaller,
    ],
    exports: [
        IssuerService,
        AgentService
    ]
})
export class IssuerModule {}
