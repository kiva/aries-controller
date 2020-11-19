import { Injectable, HttpService } from '@nestjs/common';
import {readFileSync} from 'fs';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { AgentCaller } from '../agent/agent.caller';
import { AgentService } from '../agent/agent.service';
import { Services } from '../utility/services';


/**
 * TODO it may be better to have the IssuerService extend the Agent/General Service rather than passing it in
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
     * Makes a call to the agent to create a credential definition
     */
    public async createCredDef(schema_id: string, tag: string, support_revocation: boolean): Promise<any> {
        const data = {
            schema_id,
            tag,
            support_revocation,
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
     * Issues a credential using a cred def profile stored on the server
     */
    public async issueCredentialUsingProfile(credDefProfilePath: string, connectionId: string, attributes: Array<any>): Promise<string> {
        const [credentialData,] = this.getCredDefAndSchemaData(credDefProfilePath);
        return await this.issueCredentialSend(credentialData, connectionId, attributes);
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
     * Issue a credential using a cred def profile path and some entity data which can be formatted to Aries attributes
     */
    public async issueCredential(credDefProfilePath: string, connectionId: string, entityData: any): Promise<any> {
        const [credentialData, credDefAttributes] = this.getCredDefAndSchemaData(credDefProfilePath);
        const attributes = this.formatEntityData(entityData, credDefAttributes);
        return await this.issueCredentialSend(credentialData, connectionId, attributes);
    }

    /**
     * Formats entity data in the form of an object into a set of attributes that can be used by Aries, using the cred def attributes as a guide
     */
    public formatEntityData(entityData: any, credDefAttrs: Array<string>): Array<any> {
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

    public async onboardWithAttributes(credDefProfilePath: string, guardianData: Array<any>, attributes: Array<any>): Promise<{agentId}> {
        const keyGuardRes = await this.enrollInKeyGuardian(guardianData);
        Logger.log('1: Enrolled in Key Guardian');
        const connectionRes = await this.agentService.acceptConnection(keyGuardRes.id, keyGuardRes.connectionData);
        Logger.log('2: Connection invitation created');
        const connectionId = connectionRes.connection_id;
        if (false === await Services.waitForAcceptedConnection(connectionId, this.agentCaller)) {
            // TODO add AgentConnectionError to ProtocolErrorCode
            // TODO provide more details on the state of the connection (eg what the final state was)
            throw new ProtocolException('AgentConnectionError', 'Connection was not accepted by newly created agent');
        }
        Logger.log('3: Connection accepted');
        const issueCredRes = await this.issueCredentialUsingProfile(credDefProfilePath, connectionId, attributes);
        Logger.log('4: Credential Issued');
        return {
            agentId: keyGuardRes.id
        };
    }

    /**
     * Enrolls entity in key guardian and issue credential
     * TODO need to figure out rollbacks
     */
    public async onboardEntity(credDefProfilePath: string, guardianData: Array<any>, entityData: any): Promise<any> {
        const [credentialData, credDefAttributes] = this.getCredDefAndSchemaData(credDefProfilePath);
        const attributes = this.formatEntityData(entityData, credDefAttributes);
        return await this.onboardWithAttributes(credDefProfilePath, guardianData, attributes);
    }

    /**
     * Expects an array of data formatted for the key guardian
     */
    private async enrollInKeyGuardian(guardianData: Array<any>): Promise<any> {
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
     * TODO move to facade
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
     * TODO move to facade
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
     * TODO better error handling
     */
    private getCredDefAndSchemaData(credDefProfilePath: string): any {
        const prefix = process.cwd() + '/profiles/';
        const credDefProfileString = readFileSync(prefix + credDefProfilePath).toString();
        if (!credDefProfileString) {
            throw new Error(`Failed to load profile ${credDefProfilePath}`);
        }
        const credDefProfileJson = JSON.parse(credDefProfileString);
        const credDefProfile = {...credDefProfileJson.DEFAULT, ...credDefProfileJson[process.env.NODE_ENV]};

        const attributes = credDefProfile.attributes;
        delete credDefProfile.attributes;
        delete credDefProfile.schema_profile;
        delete credDefProfile.tag;

        // Allow for overriding cred def id if present (since cred def id is the most variable amongst environments)
        if (process.env.CRED_DEF_ID) {
            credDefProfile.cred_def_id = process.env.CRED_DEF_ID;
        }
        return [credDefProfile, attributes];
    }

    /**
     * Returns the status of a credential exchange record
     */
    public async checkCredentialExchange(credentialExchangeId: string): Promise<any> {
        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'GET', `issue-credential/records/${credentialExchangeId}`);
    }
}
