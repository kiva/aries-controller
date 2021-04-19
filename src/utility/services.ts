import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { AgentCaller } from '../agent/agent.caller';
import { readdirSync, readFileSync } from 'fs';
import { Logger } from 'protocol-common/logger';

export class Services {

    public static async waitForAcceptedConnection(credentialId: string, agentCaller: AgentCaller): Promise<boolean> {
        const startOf: Date = new Date();
        const waitMS: number = parseInt(process.env.CONNECTION_WAIT_SEC, 10) * 1000;

        // we want to poll the agent every so often to see if/when the connection is completely set up
        let connection = { state: 'not_started' };
        while (waitMS > ProtocolUtility.timeDelta(new Date(), startOf)) {

            // just so we do not spam the agent, wait a bit before making a call
            await ProtocolUtility.delay(1000);
            connection = await agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'GET', `connections/${credentialId}`);
            // toThink(): we have these states and status spread out among several projects and source files.
            // TODO: should we make some shared constants?
            // Either of these 2 states is good enough to continue with the interaction
            if (connection.state === 'active' || connection.state === 'response') {
                return true;
            }
        }

        Logger.debug(`Connection not completed, final state: ${connection.state}`);
        return false;
    }

    /**
     * Loads a specific profile by fileName
     */
    public static getProfile(fileName: string): any {
        const profilesDir = process.cwd() + '/profiles/';
        const file = readFileSync(profilesDir + fileName).toString();
        if (!file) {
            throw new Error(`Invalid json in ${fileName}`);
        }
        const fileData = JSON.parse(file);
        if (fileData.DEFAULT) {
            return {...fileData.DEFAULT, ...fileData[process.env.NODE_ENV]};
        } else {
            return fileData;
        }
    }

    /**
     * Loads all profiles and returns an key-value object of fileNames => files
     */
    public static getAllProfiles(endsWithString?: string): any {
        const profilesDir = process.cwd() + '/profiles/';
        const fileNames = readdirSync(profilesDir);
        const files = {};
        for (const fileName of fileNames) {
            if (!endsWithString || (endsWithString && fileName.endsWith(endsWithString))) {
                files[fileName] = Services.getProfile(fileName);
            }
        }
        return files;
    }
}
