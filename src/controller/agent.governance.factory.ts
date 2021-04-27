import { AgentGovernance } from './agent.governance';


const governance = new Map<string, AgentGovernance>();

export const AgentGovernanceFactory = {
    provide: 'AGENT_GOVERNANCE',
    useFactory: () => {
        // return new AgentGovernance(process.env.POLICY_NAME);

        const policyName = process.env.POLICY_NAME;
        if (governance.has(policyName))
            return governance[policyName].value;

        const handler: AgentGovernance = new AgentGovernance(policyName);
        governance.set(policyName, handler);
        return handler;
    },
};
