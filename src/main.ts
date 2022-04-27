import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'protocol-common';
import { AppModule } from './app/app.module.js';
import { AppService } from './app/app.service.js';

let app: INestApplication;
const bootstrap = async () => {
    const port = process.env.PORT;
    app = await NestFactory.create(AppModule);

    await AppService.setup(app);
    await app.listen(port);
    Logger.info(`Server started on ${port}`);

    await AppService.initAgent(app);
};

bootstrap().catch(e => {
    Logger.error(e.message);
});
export { app };
