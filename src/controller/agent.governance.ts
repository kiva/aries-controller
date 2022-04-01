import { Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import data from '../config/governence.json';


/**
 * defines the callback (function) called by AgentGovernance.invokeHandler.  The signature maps to acapy webhook
 * definition.  return true or false.  true means default handlers (in this package) will not process the message
 *
 * TODO: do we want to pass governance into the callback so that implementations can be controlled through
 *       governance data
 */
export type ControllerCallback =
    (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string) => Promise<boolean>;

type Registration = { id: string; topic: string; func: ControllerCallback; exceptionCount: number};

/**
 * AgentGovernance manages the governance policy initialization and access control
 */
@Injectable()
export class AgentGovernance {
    public static PERMISSION_DENY = 'deny';
    public static PERMISSION_ONCE = 'once';
    public static PERMISSION_ALWAYS = 'always';
    private static ALL_KEY = 'all';
    private static COMMENT_SECTION = 'comment';
    public policyName = '';
    private readonly policies = { };
    private readonly callbacks = new Array<Registration>();

    constructor(policyName: string, source: any = data) {
        // flatten out the data between default and the named policy into a single policy
        this.policyName = policyName;
        this.policies = {...source.default, ...source[policyName]};
        this.validate();
    }

    // to ensure all data is valid, iterate through what has been loaded and
    // should a value not be understood, replace it with deny
    public validate() {
        // remove comments sections so that we dont have to worry about it below
        delete this.policies[AgentGovernance.COMMENT_SECTION];

        // for each item in policies, evaluate that the values are meaningful and
        // set invalid values to AgentGovernance.PERMISSION_DENY
        for (const topic of Object.keys(this.policies)) {
            // AgentGovernance.ALL_KEY is a special in that it itself is not an object but a permission
            // so we will evaluate it as permission and move to the next
            if (topic === AgentGovernance.ALL_KEY) {
                if (false === this.isValidValue( this.policies[topic])) {
                    Logger.warn(`policy ${topic} is not valid, resetting to 'deny'.`);
                    this.policies[topic] = AgentGovernance.PERMISSION_DENY;
                }
                continue;
            }
            for (const key of Object.keys(this.policies[topic])) {
                try {
                    if (false === this.isValidValue(this.policies[topic][key])) {
                        Logger.warn(`policy ${key} is not valid, resetting to 'deny'.`);
                        this.policies[topic][key] = AgentGovernance.PERMISSION_DENY;
                    }
                } catch (e) {
                    Logger.warn(`Improperly specified key found ${key}...deleting`);
                }
            }
        }
        const all = AgentGovernance.ALL_KEY in this.policies;
        if (all === undefined) {
            Logger.warn('default section may not be structured correctly.');
            this.policies[AgentGovernance.ALL_KEY] = AgentGovernance.PERMISSION_DENY;
        }
    }

    public isValidValue(value: string): boolean {
        if (!value) {
            return false;
        }
        switch (value.toLowerCase()) {
            case AgentGovernance.PERMISSION_DENY:
            case AgentGovernance.PERMISSION_ONCE:
            case AgentGovernance.PERMISSION_ALWAYS:
                return true;
        }
        return false;
    }

    // allows looking at a permission without making changes
    public peekPermission(topic: string, value: string): string {
        try {
            const permission = this.policies[topic][value];
            if (permission === undefined) {
                return this.policies[AgentGovernance.ALL_KEY];
            }
            return permission;
        } catch (e) {
            return this.policies[AgentGovernance.ALL_KEY];
        }
    }

    // once a permission is read, rules are applied to the permission
    // (like in the case of 'once')
    public readPermission(topic: string, value: string): string {
        try {
            const permission = this.policies[topic][value];
            if (permission === undefined) {
                return this.policies[AgentGovernance.ALL_KEY];
            }
            // Here's how we enforce "once", change it to deny once its been read
            // @tothink: this might create some problems because permissions are
            // per agent, not global
            if (permission === AgentGovernance.PERMISSION_ONCE) {
                this.policies[topic][value] = AgentGovernance.PERMISSION_DENY;
            }

            return permission;
        } catch (e) {
            return this.policies[AgentGovernance.ALL_KEY];
        }
    }

    /**
     * register a callback if to receive notification that a particular message
     * has been received by governance policy.  Note:  currently only the basic message handler
     * consumes invokeHandler (below).  TODO if we have more use cases, then we should move the invocation higher up
     *
     * @param id a value that makes debugging easier. duplicates will be replaced!!!!
     * @param topic a value matching values sent by acapy webhook topic parameter
     * @param func the callback, must be of type ControllerCallback
     */
    public registerHandler(id: string, topic: string, func: ControllerCallback) {
        const removeIndex: number = this.callbacks.map((item: Registration) => { return item.id; }).indexOf(id);
        if (-1 < removeIndex) {
            this.callbacks.splice(removeIndex, 1, {id, topic, func, exceptionCount: 0});
            return;
        }
        this.callbacks.push({id, topic, func, exceptionCount: 0});
    }

    /**
     * Iterate through all of the handlers registered and call the ones that match for the topic
     * This function returns true if 1 or more of the handlers processed the message.  It does not guarantee
     * that only 1 handler processed the message or that all of the handlers processed the message.
     *
     */
    public async invokeHandler(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
                               body: any, token?: string) : Promise<any> {
        let result = false;
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const index in this.callbacks) {
            const registration: Registration = this.callbacks[index];
            Logger.debug(`callback found topic: ${registration.topic} id: ${registration.id}`);
            if (registration.topic === topic) {
                const funResult: boolean = await registration.func(agentUrl, agentId, adminApiKey, route, topic, body, token);
                if (funResult === true) {
                    // only want to set this to true if a handler returns true.  it only needs to be set once but whatever
                    result = true;
                }

            }
        }
        // returning true means at least 1 handler processed the message.  It doesn't mean that all handlers
        // proceeded the message or that only 1 handler processed the message
        return result;
    }
}
