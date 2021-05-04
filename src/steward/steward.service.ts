import { Inject, Injectable } from '@nestjs/common';
import { CALLER, ICaller } from '../caller/caller.interface';

/**
 *
 */
@Injectable()
export class StewardService {

    constructor(@Inject(CALLER) private readonly agentCaller: ICaller) {}

    public async createSchema(schema_name: string, schema_version: string, attributes: Array<string>): Promise<any> {
        const data = {
            schema_name,
            schema_version,
            attributes,
        };
        return await this.agentCaller.callAgent('POST', 'schemas', null, data);
    }

    public async onboardEndorser(did: string, verkey: string, alias: string): Promise<any> {
        const params = {
            did,
            verkey,
            alias,
            role: 'ENDORSER'
        };
        return await this.agentCaller.callAgent('POST', 'ledger/register-nym', params);
    }


}
