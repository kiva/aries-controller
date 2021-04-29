import { Module, HttpModule } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { CallerModule } from '../caller/caller.module';

/**
 *
 */
@Module({
    imports: [
        HttpModule,
        GlobalCacheModule,
        CallerModule.registerAsync()
    ],
    controllers: [AgentController],
    providers: [
        AgentService,
    ],
    exports: [
        AgentService,
    ]
})
export class AgentModule {}
