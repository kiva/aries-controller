import { ProtocolException } from 'protocol-common/protocol.exception';
import { IAgentResponseHandler } from './agent.response.handler';

/*
    This class contains functions found in derived classes.  This class should never
    be allocated directly, create a derived class.
*/
export abstract class BaseAgentResponseHandler implements IAgentResponseHandler {

    abstract handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
                            body: any, token?: string): Promise<any>;
}
