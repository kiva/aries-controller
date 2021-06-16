import { CacheStore, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { Services } from 'utility/services';

/**
 * All our controllers have access to a persistent file store and a cache module so we use that to store profiles
 * In the future we could add a database or other data store if we wanted
 */
@Injectable()
export class ProfileManager  {

    readonly prefix = 'profile_';

    constructor(
        @Inject(CACHE_MANAGER) protected readonly cache: CacheStore,
    ) { }

    /**
     * Saves to cache with default storage time of infinity
     */
    public async save(key: string, value: any, ttl = Infinity): Promise<void> {
        await this.cache.set(this.prefix + key, value, { ttl });
    }

    public async get(key: string): Promise<any> {
        return await this.cache.get(this.prefix + key);
    }

    public async append(key: string, appendKey: string, appendValue: string): Promise<void> {
        let data = await this.cache.get(this.prefix + key);
        if (!data) {
            Logger.debug('profile data is empty');
            data = {};
        }
        data[appendKey] = appendValue;
        await this.cache.set(this.prefix + key, data, { ttl: Infinity });
    }

    /**
     * Takes any profiles stored on disk and loads them into the cache
     * Override defaults to false as generally we prefer the cached version (which is newer) to the disk version
     */
    public async initFromDisk(override = false): Promise<void> {
        const profiles = Services.getAllProfiles();
        for (const key of Object.keys(profiles)) {
            // If we're not in override mode, then skip if it already exists
            if (!override) {
                const exists = await this.get(key);
                if (exists) {
                    continue;
                }
            }
            await this.save(key, profiles[key]);
        }
    }

}
