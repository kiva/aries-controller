import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppService } from '../src/app/app.service';
import { AppController } from '../src/app/app.controller';
import { AgentGovernance } from '../src/controller/agent.governance';
import { HandlerCallback } from '../dist/controller/agent.governance';

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
        const agentGovernance: AgentGovernance = new AgentGovernance('doesnt_matter');
    });

    it('Governance isValidValue detects invalid value', () => {
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        expect(false === agentGovernance.isValidValue('bob'));
    });

    it('Governance validates correctly adjusts invalid value', () => {
        const data = {
            default : {
                all: 'deny'
            },
            somethingWrong : {
                invalidTopic : {
                    invalidPermission: 'jibberish'
                }
            }
        };
        const agentGovernance: AgentGovernance = new AgentGovernance('somethingWrong', data);
        expect(agentGovernance.readPermission('invalidTopic', 'invalidPermission') === 'deny');
    });

    it('Governance validate correctly adds all', () => {
        const data = {
            somethingWrong : {
                invalidTopic : {
                    invalidPermission: 'jibberish'
                }
            }
        };
        const agentGovernance: AgentGovernance = new AgentGovernance('somethingWrong', data);
        // all, all doesnt exist so it should return default of deny
        expect(agentGovernance.readPermission('all','all') === 'deny');
    });

    it('Governance changes once permission to deny on use', () => {
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        expect(agentGovernance.readPermission('Permissive', 'invitation') === 'once');
        expect(agentGovernance.readPermission('Permissive', 'invitation') === 'deny');
    });

    it('Can add custom handler successfully', () =>{
        //
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        const customHandler: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                return undefined;
            };

        agentGovernance.registerHandler('bob', customHandler);
    });

    it('Can add second handler with same key successfully', () =>{
        //
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        const customHandler: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                return undefined;
            };

        agentGovernance.registerHandler('bob', customHandler);
    });

    it('Can additional handler successfully', () =>{
        //
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        const customHandler: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                return undefined;
            };

        agentGovernance.registerHandler('bob2', customHandler);
    });

    it('Invoke custom handler successfully', async () =>{
        let sum: number = 0;
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        const customHandler: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                sum ++;
                return undefined;
            };

        agentGovernance.registerHandler('bob', customHandler);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum === 1);
    });

    it('No handler handled successfully', async() =>{
        let sum: number = 0;
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        // @ts-ignore
        const customHandler: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                sum ++;
                return undefined;
            };

        agentGovernance.registerHandler('bob', customHandler);
        await agentGovernance.invokeHandler('', '', '', '', 'not-bob', '');
        expect(sum === 0);
    });

    it('Both handler for same topic called successfully', async() =>{
        let sum1: number = 0;
        let sum2: number = 0;
        let sum3: number = 0;
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        const customHandler1: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                sum1 ++;
                return undefined;
            };
        const customHandler2: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                sum2 ++;
                return undefined;
            };
        const customHandler3: HandlerCallback =
            (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
             body: any, token?: string): Promise<any> => {
                sum3 ++;
                return undefined;
            };

        agentGovernance.registerHandler('bob', customHandler1);
        agentGovernance.registerHandler('bob', customHandler2);
        agentGovernance.registerHandler('not-bob', customHandler3);
        await agentGovernance.invokeHandler('', '', '', '', 'bob', '');
        expect(sum1 === 1);
        expect(sum2 === 1);
        expect(sum3 === 0);
    });
});
