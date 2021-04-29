import { Module, DynamicModule } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module';
import { MultiControllerHandler } from '../controller.handler/multi.controller.handler';
import { SingleControllerHandler } from '../controller.handler/single.controller.handler';

/**
 *
 */
 @Module({})
 export class ControllerHandlerModule {
    static async registerAsync(): Promise<DynamicModule> {
        const multiController = (process.env.MULTI_CONTROLLER === 'true');
        const controllerHandler = multiController ? MultiControllerHandler : SingleControllerHandler;
        return {
            module: ControllerHandlerModule,
            imports: [
                GlobalCacheModule
            ],
            providers: [
                {
                    provide: 'CONTROLLER_HANDLER',
                    useClass: controllerHandler
                },
            ],
            exports: [
                'CONTROLLER_HANDLER'
            ],
        };
    }
 }