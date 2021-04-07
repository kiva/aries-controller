import { Injectable, HttpService, CacheStore, CACHE_MANAGER, Inject } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { AgentCaller } from '../agent/agent.caller';
import { AgentService } from '../agent/agent.service';
import { Services } from '../utility/services';

/**
 * TODO maybe more of the kyc logic should be moved in here
 */
@Injectable()
export class VerifierService {

    private readonly http: ProtocolHttpService;

    constructor(
        private readonly agentService: AgentService,
        private readonly agentCaller: AgentCaller,
        httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    public async verify(proofProfilePath: string, connectionId: string): Promise<any> {
        const proofProfile = Services.getProfile(proofProfilePath);
        proofProfile.connection_id = connectionId;
        return await this.agentCaller.callAgent(
            process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'POST', 'present-proof/send-request', null, proofProfile);
    }

    /**
     * TODO eventually this should be controlled by callbacks, ie once the verifier's agent gets the final proof it will emit a webhook
     * For now we just poll
     */
    public async getVerifyResult(presExId: string): Promise<any> {
        const startOf: Date = new Date();
        const waitMS: number = parseInt(process.env.PROOF_WAIT_SEC, 10) * 1000;

        // we want to poll the agent every so often to see if/when the proof is completely set up
        // (aka state === active).
        while (waitMS > ProtocolUtility.timeDelta(new Date(), startOf)) {
            // Check proof exchange
            const res = await this.checkPresEx(presExId);
            Logger.log(res.state, res);
            if (res.state === 'verified') {
                Logger.log('Proof record state verified');
                return res;
            }
            await this.handleProblemReport(res.thread_id);
            await ProtocolUtility.delay(1000);
        }
        throw new ProtocolException('ProofFailedNoResponse', 'Proof exchange never completed'); // TODO replace ProtocolErrorCode
    }

    /**
     * If a problem report web hook has come it it will be cached by thread id
     * If it's a known json parsable exception throw a ProtocolException, otherwise log and continue on
     */
    private async handleProblemReport(threadId: string) {
        const problemReport: string = await this.cache.get(threadId);
        if (problemReport) {
            let exception;
            try {
                exception = JSON.parse(problemReport);
            } catch (e) {
                Logger.warn('Unparsable JSON in problem report: ', problemReport);
            }
            if (exception && exception.code && exception.message) {
                throw new ProtocolException(exception.code, exception.message);
            } else {
                Logger.warn('Unknown problem report: ', problemReport);
            }
        }
    }

    /**
     * Calls agent to get presentation record by id
     */
    public async checkPresEx(presExId: string): Promise<any> {
        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'GET', `present-proof/records/${presExId}`);
    }

    /**
     * TODO add DTO object which enforces correctly formatted input data
     */
    public async escrowVerify(data: any, proofProfilePath: string): Promise<any> {
        const keyGuardRes = await this.verifyWithKeyGuardian(data);
        Logger.log('Verified with Key Guardian');
        const connectionData = keyGuardRes.connectionData;
        if (!connectionData) {
            return keyGuardRes;
        }

        // TODO update to accept a null alias (switch the order on acceptConnection)
        const connectionRes = await this.agentService.acceptConnection('alias', connectionData);

        const connectionId = connectionRes.connection_id;
        if (false === await Services.waitForAcceptedConnection(connectionId, this.agentCaller)) {
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, 'connection was not established', null, 500);
        }

        Logger.log('Accepted connection invitation');
        // TODO the ping is not really needed and can be removed eventually - useful for seeing where things are failing
        const pingRes = await this.agentService.sendPing(connectionId);
        Logger.log('Ping sent');
        const requestRes = await this.verify(proofProfilePath, connectionId);
        Logger.log('Verify proof send');
        const presExId = requestRes.presentation_exchange_id;
        const verifyRes = await this.getVerifyResult(presExId);
        const values = await this.getValuesFromVerifyRes(verifyRes);
        return values;

    }

    /**
     * TODO move this to a Key-Guardian facade
     */
    private async verifyWithKeyGuardian(data: any): Promise<any> {
        // Start the verification flow with the key guardian
        const req: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/verify',
            data,
        };
        const keyGuardRes = await this.http.requestWithRetry(req);
        return keyGuardRes.data;
    }

    /**
     * TODO error handling + maybe some more useful bit of info like the issuer did, etc
     * TODO may need special handling for attachments
     * Handles throwing an exception if the proof failed verification
     */
    private getValuesFromVerifyRes(verifyRes): any {
        if (verifyRes.verified === 'false') {
            throw new ProtocolException('ProofFailedVerification', 'Proof failed verification, possibly it’s been revoked'); // todo ProtocolErrorCode
        }
        const attributes = verifyRes.presentation.requested_proof.revealed_attrs;
        const keys = Object.keys(attributes);
        const values = {};
        for (const key of keys) {
            const value = attributes[key].raw;
            values[key] = value;
        }
        return values;
    }

}
