import { CacheStore, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { Services } from '../utility/services';

/**
 * All our controllers have access to a persistent file store and a cache module so we use that to store profiles
 * In the future we could add a database or other data store if we wanted
 */
@Injectable()
export class ProfileManager  {

    readonly prefix = 'profile_';
    readonly keysKey = 'keys';

    constructor(
        @Inject(CACHE_MANAGER) protected readonly cache: CacheStore,
    ) { }

    /**
     * Saves to cache with default storage time of infinity
     * Also saves a record of the key so we can fetch all later
     */
    public async save(key: string, value: any, ttl = Infinity): Promise<void> {
        await this.cache.set(this.prefix + key, value, { ttl });
        await this.appendArray(this.keysKey, key);
    }

    public async get(key: string): Promise<any> {
        return await this.cache.get(this.prefix + key);
    }

    /**
     * Appends appendValue to existing object buy appendKey
     */
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
     * Appends appendValue to existing array
     */
    public async appendArray(key: string, appendValue: string): Promise<void> {
        let data: Array<any> = await this.cache.get(this.prefix + key);
        if (!data) {
            Logger.debug('profile data is empty');
            data = [];
        }
        if (!data.includes(appendValue)) {
            data.push(appendValue);
        }
        await this.cache.set(this.prefix + key, data, { ttl: Infinity });
    }

    /**
     * Returns all profiles that have been saved
     * Optional endsWithString param to only include keys that end with a given value
     */
    public async getAllProfiles(endsWithString?: string): Promise<any> {
        const keys = await this.get(this.keysKey);
        const profiles = {};
        for (const key of keys) {
            if (!endsWithString || (endsWithString && key.endsWith(endsWithString))) {
                const returnKey = key.replace(this.prefix, '');
                profiles[returnKey] = await this.get(key);
            }
        }
        return profiles;
    }

    /**
     * Takes any profiles stored on disk and loads them into the cache
     * Override defaults to false as generally we prefer the cached version (which is newer) to the disk version
     */
    public async initFromDisk(override = false): Promise<void> {
        Logger.debug('Loading all profiles into cache');
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
