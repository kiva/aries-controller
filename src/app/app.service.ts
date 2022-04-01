/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'body-parser';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { Logger } from 'protocol-common/logger';
import { DatadogLogger } from 'protocol-common/datadog.logger';
import { traceware } from 'protocol-common/tracer';
import { Constants } from 'protocol-common/constants';
import { HttpConstants } from 'protocol-common/http-context/http.constants';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { AgentService } from '../agent/agent.service';
import { Services } from '../utility/services';

/**
 * All external traffic will be routed through gateway so no need for things like rate-limiting here
 */
@Injectable()
export class AppService {

    /**
     * Sets up app in a way that can be used by main.ts and e2e tests
     */
    public static async setup(app: INestApplication): Promise<void> {
        const logger = new Logger(DatadogLogger.getLogger());
        app.useLogger(logger);
        app.use(traceware(process.env.SERVICE_NAME));

        app.useGlobalFilters(new ProtocolExceptionFilter());

        // Increase json parse size to handle encoded images
        app.use(json({ limit: HttpConstants.JSON_LIMIT }));

        // Load swagger docs and display
        if (process.env.NODE_ENV === Constants.LOCAL) {
            // Set up internal documentation at /api
            const options = new DocumentBuilder()
                .setTitle('Aries Controller')
                .setDescription('Internal Documentation for the Aries Controller')
                .setVersion('1.0')
                .build();
            const document = SwaggerModule.createDocument(app, options);
            SwaggerModule.setup('api-docs', app, document, { customfavIcon: null });
        }

        AppService.loadProfile();
    }

    /**
     * Find a give profile JSON and load values into env vars (note: generic controllers won't have profiles)
     *
     * @tothink there are a few different ways we could handle these profiles: files, loaded in code directly, database, etc
     */
    public static loadProfile() {
        try {
            const profile = Services.getProfile('profile.json');
            for (const key of Object.keys(profile)) {
                process.env[key.toUpperCase()] = profile[key];
            }
        } catch (e) {
            Logger.warn('Failed to load profile, this is ok if no profile file is included', e);
        }
    }

    /**
     * Try twice to spin up the agent, if it fails, quit
     * Register shutdown signals to shut down agent when controller shuts down
     * Note we only want to spin up an agent on system start if it's single controller - for multicontroller we spin up on register
     */
    public static async initAgent(app: INestApplication) {
        const agentService = await app.resolve(AgentService);
        await agentService.initProfilesFromDisk();
        if (process.env.MULTI_CONTROLLER === 'true') {
            return;
        }

        try {
            await agentService.init();
        } catch (e) {
            Logger.log(`Failed to start agent, retrying... ${e.message as string}`, e);
            try {
                await ProtocolUtility.delay(1000);
                await agentService.init();
            } catch (e2) {
                Logger.log(`Failed to start agent, exiting... ${e2.message as string}`, e2);
                if (process.env.NODE_ENV !== Constants.LOCAL) {
                    // For non-local envs we want k8s to restart, locally we leave it up so we can investigate
                    process.exit(1);
                }
            }
        }

        // Shut down agent on controller shutdown
        // Note: attempted the nestjs method of using OnApplicationShutdown but it didn't work so manually tying into the shut down signals
        process.on('SIGINT', async () => {
            agentService.spinDown().catch(e => {
                Logger.error('Failed to spin down agent servce');
                Logger.error(e.message);
            });
        });

        process.on('SIGTERM', () => {
            agentService.spinDown().catch(e => {
                Logger.error('Failed to spin down agent servce');
                Logger.error(e.message);
            });
        });
    }
}
