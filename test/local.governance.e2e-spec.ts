/**
 * Disabling import/extensions because this runs against typescript
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppService } from '../dist/app/app.service';
import { AppController } from '../dist/app/app.controller';
import { AgentGovernance } from '../dist/controller/agent.governance.js';
import { ControllerCallback } from '../dist';
import { AgentGovernanceFactory } from '../dist/controller/agent.governance.factory.js';

describe('Governance tests', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            providers: [AppService],
            controllers: [AppController],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('Governance installed data is valid', () => {
        new AgentGovernance('doesnt_matter');
    });

    it('Governance isValidValue detects invalid value', () => {
        const agentGovernance = new AgentGovernance('permissive');
        const result = agentGovernance.isValidValue('bob');
        expect(result).toBe(false);
    });

    it('Governance validates correctly adjusts invalid value', () => {
        const data: any = {
            default : {
                all: 'deny'
            },
            somethingWrong : {
                invalidTopic : {
                    invalidPermission: 'jibberish'
                }
            }
        };
        const agentGovernance = new AgentGovernance('somethingWrong', data);
        const result = agentGovernance.readPermission('invalidTopic', 'invalidPermission');
        expect(result).toBe('deny');
    });

    it('Governance validate correctly adds all', () => {
        const data: any = {
            somethingWrong : {
                invalidTopic : {
                    invalidPermission: 'jibberish'
                }
            }
        };
        const agentGovernance = new AgentGovernance('somethingWrong', data);
        // all, all doesn't exist so it should return default of deny
        const result = agentGovernance.readPermission('all','all');
        expect(result).toBe('deny');
    });

    it('Governance changes once permission to deny on use', () => {
        const agentGovernance = new AgentGovernance('SingleConnection');
        const firstResult = agentGovernance.readPermission('connections', 'accept-invitation');
        expect(firstResult).toBe('once');
        const secondResult = agentGovernance.readPermission('connections', 'accept-invitation');
        expect(secondResult).toBe('deny');
    });

    it('factory returns previously created instance', async () => {
        const agentGovernance = AgentGovernanceFactory.useFactory();
        let count = 0;
        const customHandler: ControllerCallback = (): Promise<any> => {
            count ++;
            return undefined;
        };
        agentGovernance.registerHandler('1','something', customHandler);

        const agentGovernance2 = AgentGovernanceFactory.useFactory();
        await agentGovernance2.invokeHandler('', '', '', '', 'something', '');
        expect(count).toBe(1);

    });

    it('factory returns new instance', async () => {
        const agentGovernance = AgentGovernanceFactory.useFactory();
        let count = 0;
        const customHandler: ControllerCallback = (): Promise<any> => {
            count ++;
            return undefined;
        };
        agentGovernance.registerHandler('2','something', customHandler);

        const policyName = process.env.POLICY_NAME;
        process.env.POLICY_NAME = 'bob';
        const agentGovernance2 = AgentGovernanceFactory.useFactory();
        await agentGovernance2.invokeHandler('', '', '', '', 'something', '');
        expect(count).toBe(0);
        process.env.POLICY_NAME = policyName;

    });

    it('Can add custom handler successfully', () =>{
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler: ControllerCallback = (): Promise<any> => {
            return undefined;
        };

        agentGovernance.registerHandler('3','bob', customHandler);
    });

    it('Can add second handler with same key successfully', () =>{
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler: ControllerCallback = (): Promise<any> => {
            return undefined;
        };

        agentGovernance.registerHandler('4','bob', customHandler);
    });

    it('Can additional handler successfully', () =>{
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler: ControllerCallback = (): Promise<any> => {
            return undefined;
        };

        agentGovernance.registerHandler('5','bob2', customHandler);
    });

    it('Invoke custom handler successfully', async () =>{
        let sum = 0;
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler: ControllerCallback = (): Promise<any> => {
            sum ++;
            return undefined;
        };

        agentGovernance.registerHandler('6','bob', customHandler);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum).toBe(1);
    });

    it('No handler handled successfully', async() =>{
        let sum = 0;
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler: ControllerCallback = (): Promise<any> => {
            sum ++;
            return undefined;
        };

        agentGovernance.registerHandler('7','bob', customHandler);
        await agentGovernance.invokeHandler('', '', '', '', 'not-bob', '');
        expect(sum).toBe(0);
    });

    it('Both handler for same topic called successfully', async() =>{
        let sum1 = 0;
        let sum2 = 0;
        let sum3 = 0;
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler1: ControllerCallback = (): Promise<any> => {
            sum1 ++;
            return undefined;
        };
        const customHandler2: ControllerCallback = (): Promise<any> => {
            sum2 ++;
            return undefined;
        };
        const customHandler3: ControllerCallback = (): Promise<any> => {
            sum3 ++;
            return undefined;
        };

        agentGovernance.registerHandler('8','bob', customHandler1);
        agentGovernance.registerHandler('9','bob', customHandler2);
        agentGovernance.registerHandler('10','not-bob', customHandler3);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum1).toBe(1);
        expect(sum2).toBe(1);
        expect(sum3).toBe(0);
    });

    it('Register same callback id twice successfully', async() => {
        let sum1 = 0;
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler1: ControllerCallback = (): Promise<any> => {
            sum1 ++;
            return undefined;
        };

        agentGovernance.registerHandler('8','bob', customHandler1);
        agentGovernance.registerHandler('8','bob', customHandler1);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum1).toBe(1);
    });

    it('Register same callback id twice end of array successfully', async() => {
        let sum1 = 0;
        let sum2 = 0;
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler1: ControllerCallback = (): Promise<any> => {
            sum1++;
            return undefined;
        };
        const customHandler2: ControllerCallback = (): Promise<any> => {
            sum2++;
            return undefined;
        };

        agentGovernance.registerHandler('8', 'bob', customHandler1);
        agentGovernance.registerHandler('9', 'bob', customHandler2);
        agentGovernance.registerHandler('9', 'bob', customHandler2);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum1).toBe(1);
        expect(sum2).toBe(1);
    });

    it('Register same callback id twice with new callback end of array successfully', async() => {
        let sum1 = 0;
        let sum2 = 0;
        let sum3 = 0;
        const agentGovernance = new AgentGovernance('permissive');
        const customHandler1: ControllerCallback = (): Promise<any> => {
            sum1++;
            return undefined;
        };
        const customHandler2: ControllerCallback = (): Promise<any> => {
            sum2++;
            return undefined;
        };
        const customHandler3: ControllerCallback = (): Promise<any> => {
            sum3 ++;
            return undefined;
        };

        agentGovernance.registerHandler('8', 'bob', customHandler1);
        agentGovernance.registerHandler('9', 'bob', customHandler2);
        agentGovernance.registerHandler('9', 'bob', customHandler3);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum1).toBe(1);
        expect(sum2).toBe(0);
        expect(sum3).toBe(1);
    });
});
