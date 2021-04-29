import { CacheStore, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';

/**
 * Grouping calls here for convenience, eventually this will be replaced with a DB
 */
@Injectable()
export class ProfileManager  {

    readonly prefix = 'profile_';

    constructor(
        @Inject(CACHE_MANAGER) protected readonly cache: CacheStore,
    ) { }

    public async save(key: string, value: any): Promise<void> {
        await this.cache.set(this.prefix + key, value);
    }

    public async get(key: string): Promise<any> {
        return await this.cache.get(this.prefix + key);
    }

    public async append(key: string, appendKey: string, appendValue: string): Promise<void> {
        const data = this.cache.get(this.prefix + key);
        if (!data) {

        }
        data[appendKey] = appendValue;
        await this.cache.set(this.prefix + key, data);
    }

}
