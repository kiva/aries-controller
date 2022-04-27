import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { ProfileManager } from './profile.manager.js';
import { SecretsManager } from './secrets.manager.js';

/**
 * For simplicity we have the ProfileModule export both the Profile and Secrets managers
 */
@Module({
    imports: [
        GlobalCacheModule
    ],
    providers: [
        ProfileManager,
        SecretsManager
    ],
    exports: [
        ProfileManager,
        SecretsManager
    ]
})
export class ProfileModule {}
