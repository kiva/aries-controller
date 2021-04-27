import { Module, HttpModule } from '@nestjs/common';
import { StewardService } from './steward.service';
import { StewardController } from './steward.controller';
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
    controllers: [StewardController],
    providers: [
        StewardService,
    ],
})
export class StewardModule {}
