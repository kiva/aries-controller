import { Module, HttpModule } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
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
