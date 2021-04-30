import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module';
import { ProfileManager } from './profile.manager';

/**
 *
 */
@Module({
    imports: [
        GlobalCacheModule
    ],
    providers: [
        ProfileManager,
    ],
    exports: [
        ProfileManager,
    ]
})
export class ProfileModule {}
