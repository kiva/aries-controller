import { Module } from '@nestjs/common';
import { StewardService } from './steward.service.js';
import { StewardController } from './steward.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { CallerModule } from '../caller/caller.module.js';

/**
 *
 */
@Module({
    imports: [
        GlobalCacheModule,
        CallerModule.registerAsync()
    ],
    controllers: [StewardController],
    providers: [
        StewardService,
    ],
})
export class StewardModule {}
