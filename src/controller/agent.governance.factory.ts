import { AgentGovernance } from './agent.governance';


const governanceMap = new Map<string, AgentGovernance>();

export const AgentGovernanceFactory = {
    provide: 'AGENT_GOVERNANCE',
    useFactory: () => {
        const policyName = process.env.POLICY_NAME;
        if (governanceMap.has(policyName)) {
            return governanceMap.get(policyName);
        }

        const governanceInstance: AgentGovernance = new AgentGovernance(policyName);
        governanceMap.set(policyName, governanceInstance);
        return governanceInstance;
    },
};
