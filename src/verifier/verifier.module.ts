import { Module, HttpModule } from '@nestjs/common';
import { VerifierService } from './verifier.service';
import { VerifierController } from './verifier.controller';
import { AgentModule } from '../agent/agent.module';
import { AgentService } from '../agent/agent.service';
import { GlobalCacheModule } from '../app/global.cache.module';
import { CallerModule } from '../caller/caller.module';
import { ProfileModule } from '../profile/profile.module';

/**
 *
 */
@Module({
    imports: [
        AgentModule,
        HttpModule,
        GlobalCacheModule,
        CallerModule.registerAsync(),
        ProfileModule,
    ],
    controllers: [VerifierController],
    providers: [
        VerifierService,
        AgentService,
    ],
    exports: [VerifierService]
})
export class VerifierModule {}
