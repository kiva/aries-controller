import { Injectable } from '@nestjs/common';
import { ProfileManager } from './profile.manager';

@Injectable()
export class SecretsManager extends ProfileManager {

    protected prefix = 'secrets_';
    protected keysKey = 'keys';
}