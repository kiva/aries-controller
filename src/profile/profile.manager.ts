import { CacheStore, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';

/**
 * Grouping calls here for convenience, eventually we will replace cache calls with DB calls
 * Future work described in this ticket: https://kiva.atlassian.net/browse/PRO-2999
 */
@Injectable()
export class ProfileManager  {

    readonly prefix = 'profile_';

    constructor(
        @Inject(CACHE_MANAGER) protected readonly cache: CacheStore,
    ) { }

    public async save(key: string, value: any): Promise<void> {
        await this.cache.set(this.prefix + key, value, { ttl: Infinity });
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

}
