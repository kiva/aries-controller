import { Injectable, HttpService } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { AgentCaller } from '../agent/agent.caller';
import { AgentService } from '../agent/agent.service';
import { Services } from '../utility/services';

/**
 * TODO it may be better to have the IssuerService extend the Agent/General Service rather than passing it in
 * TODO need to figure out rollbacks - ie if one part fails need to roll back any saved data
 */
@Injectable()
export class IssuerService {

    private readonly http: ProtocolHttpService;

    constructor(
        public readonly agentService: AgentService,
        private readonly agentCaller: AgentCaller,
        httpService: HttpService,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * Issue a credential to existing connection using a cred def profile path and some entity data which can be formatted to Aries attributes
     */
    public async issueCredential(credDefProfilePath: string, connectionId: string, entityData: any): Promise<any> {
        const [credentialData, credDefAttributes] = this.getCredDefAndSchemaData(credDefProfilePath);
        const attributes = this.formatEntityData(entityData, credDefAttributes);
        return await this.issueCredentialSend(credentialData, connectionId, attributes);
    }

    /**
     * Full onboarding flow - enrolls entity in key guardian and issue credential
     */
    public async onboardEntity(credDefProfilePath: string, guardianData: Array<any>, entityData: any): Promise<any> {
        const keyGuardRes = await this.enrollInKeyGuardian(guardianData);
        Logger.log('1: Enrolled in Key Guardian');
        const connectionRes = await this.agentService.acceptConnection(keyGuardRes.id, keyGuardRes.connectionData);
        Logger.log('2: Connection invitation created');
        if (false === await Services.waitForAcceptedConnection(connectionRes.connection_id, this.agentCaller)) {
            // TODO add AgentConnectionError to ProtocolErrorCode
            // TODO provide more details on the state of the connection (eg what the final state was)
            throw new ProtocolException('AgentConnectionError', 'Connection was not accepted by newly created agent');
        }
        Logger.log('3: Connection accepted');
        const agentData = await this.issueCredential(credDefProfilePath, connectionRes.connection_id, entityData);
        Logger.log('4: Credential Issued');
        return {
            agentId: keyGuardRes.id,
            agentData
        };
    }

    /**
     * Enrolls an entity in the key guardian which multiple authentication methods
     * Expects an array of data formatted for the key guardian
     */
    public async enrollInKeyGuardian(guardianData: Array<any>): Promise<any> {
        let id;
        let returnData;
        for (const guardianEntry of guardianData) {
            if (!id) {
                returnData = await this.createKeyGuardianEntry(guardianEntry);
                id = returnData.id;
            } else {
                await this.addKeyGuardianEntry(id, guardianEntry);
            }
        }
        return returnData;
    }

    /**
     * Given a previously enrolled entity, issues a credential after verifying with the key guardian
     */
    public async issueInGuardianship(credDefProfilePath: string, guardianVerifyData: any, entityData: any): Promise<any> {
        const keyGuardRes = await this.verifyWithKeyGuardian(guardianVerifyData);
        Logger.log('1. Verified with Key Guardian');
        if (!keyGuardRes.connectionData) {
            return keyGuardRes;
        }
        const connectionRes = await this.agentService.acceptConnection('alias', keyGuardRes.connectionData);
        Logger.log('2: Connection invitation created');
        if (false === await Services.waitForAcceptedConnection(connectionRes.connection_id, this.agentCaller)) {
            throw new ProtocolException('AgentConnectionError', 'Connection was not accepted by newly created agent');
        }
        Logger.log('3. Accepted connection invitation');
        const agentData = await this.issueCredential(credDefProfilePath, connectionRes.connection_id, entityData);
        Logger.log('4: Credential Issued');
        return {
            agentId: keyGuardRes.id,
            agentData
        };
    }

    /**
     * Formats entity data in the form of an object into a set of attributes that can be used by Aries, using the cred def attributes as a guide
     */
    private formatEntityData(entityData: any, credDefAttrs: Array<string>): Array<any> {
        const attributes = [];
        for (const key of credDefAttrs) {
            if (key.endsWith('~attach')) {
                attributes.push({
                    name: key,
                    value: entityData[key] || '',
                    'mime-type': 'text/plain'
                });
            } else {
                attributes.push({
                    name: key,
                    value: entityData[key] || '',
                });
            }
        }
        return attributes;
    }

    /**
     * The underlying indy protocol can't handle null attribute values, so we replace with empty strings
     */
    private sanitizeAttributes(attributes: Array<any>): Array<any> {
        for (const key of attributes.keys()) {
            if (attributes[key].value == null) {
                attributes[key].value = '';
            }
        }
        return attributes;
    }

    /**
     * TODO better error handling
     */
    private getCredDefAndSchemaData(credDefProfilePath: string): any {
        const credDefProfile = Services.getProfile(credDefProfilePath);
        const attributes = credDefProfile.attributes;
        delete credDefProfile.attributes;
        delete credDefProfile.schema_profile;
        delete credDefProfile.tag;
        return [credDefProfile, attributes];
    }

    // -- Key Guardian calls -- //

    /**
     * TODO move this to a Key-Guardian facade
     */
    private async createKeyGuardianEntry(data: any): Promise<any> {
        const req: any = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/create', // TODO change to 'enroll'
            data
        };
        const result = await this.http.requestWithRetry(req);
        Logger.log('Created first key guardian entry');
        return result.data;
    }

    /**
     * TODO move this to a Key-Guardian facade
     */
    private async addKeyGuardianEntry(id: string, data: any): Promise<any> {
        data.id = id;
        const req: any = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/add',
            data
        };
        const result = await this.http.requestWithRetry(req);
        Logger.log('Added to key guardian');
        return result.data;
    }

    /**
     * TODO move this to a Key-Guardian facade
     * TODO make DRY with verifier.service.ts
     */
    private async verifyWithKeyGuardian(data: any): Promise<any> {
        const req: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/verify',
            data,
        };
        const keyGuardRes = await this.http.requestWithRetry(req);
        return keyGuardRes.data;
    }

    // -- Agent calls -- //

    /**
     * Makes a call to the agent to create a credential definition
     */
    public async createCredDef(schema_id: string, tag: string, support_revocation: boolean, revocation_registry_size : number): Promise<any> {

        if (support_revocation && (revocation_registry_size === 0)) {
            revocation_registry_size; process.env.DEFAULT_REV_REG_SIZE;
        }

        const data = {
            schema_id,
            tag,
            support_revocation,
            revocation_registry_size : support_revocation ? revocation_registry_size : 0
        };

        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'POST', 'credential-definitions', null, data);
    }

    /**
     * Makes a call to the agent to issue a credential
     */
    public async issueCredentialSend(credentialData: any, connectionId: string, attributes: Array<any>): Promise<string> {
        credentialData.connection_id = connectionId;
        credentialData.credential_proposal.attributes = this.sanitizeAttributes(attributes);
        return await this.agentCaller.callAgent(
            process.env.AGENT_ID,
            process.env.ADMIN_API_KEY,
            'POST',
            'issue-credential/send',
            null,
            credentialData
        );
    }

    /**
     * Returns the status of a credential exchange record
     */
    public async checkCredentialExchange(credentialExchangeId: string): Promise<any> {
        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'GET', `issue-credential/records/${credentialExchangeId}`);
    }

    /**
     * Revokes credential using the cred_rev_id and rev_reg_id
     */
    public async revokeCredential(credential_exchange_id : number, publish : boolean): Promise<any> {
        const data = {
            credential_exchange_id,
            publish,
        };
        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'POST', 'revocation/revoke', data, null);
    }

    /**
     * Optional: not adding any filters now, but if there's a use case aca-py supports the following:
     *   connection_id, role, state, thread_id
     */
    public async getAllRecords(): Promise<any> {
        const records = await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'GET', `issue-credential/records`);
        const formatted = [];
        for (const record of records.results) {
            formatted.push(this.formatRecord(record));
        }
        return formatted;
    }

    /**
     * The records return from aca-py have a lot of extra data that we don't need, this just includes the
     * Optional: new fields can easily be added if the front end needed
     *   eg right now we don't include photo since they're large, but it's available at: record.credential_offer_dict.credential_preview.offers~attach
     */
    private formatRecord(record: any) {
        // Format aries' style attributes into easier to grok entityData
        const attributes = record.credential_offer_dict.credential_preview.attributes;
        const attribObj = {};
        for (const attribute of attributes) {
            attribObj[attribute.name] = attribute.value;
        }
        return {
            entityData: attribObj,
            connection_id: record.connection_id,
            schema_id: record.schema_id,
            credential_definition_id: record.credential_definition_id,
            credential_exchange_id: record.credential_exchange_id,
            state: record.state,
            created_at: record.created_at,
            thread_id: record.thread_id,
            updated_at: record.updated_at,
            revocation_id: record.revocation_id || null,
            credential_id: record.credential_id || null,
            revoc_reg_id: record.revoc_reg_id || null,
        };
    }
}
