import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardianIssuePostReqDto {

    @ApiProperty({
        type: String,
        description: 'The profile name of the json file stored on the server'
    })
    @IsString() readonly profile: string;

    @ApiProperty({
        type: Object,
        description: 'The guardian data to verify the entity, eg fingerprints. Should include \'pluginType\', \'filters\' and \'params\''
    })
    @IsObject() readonly guardianVerifyData: object;

    @ApiProperty({
        type: Object,
        description: 'The entity data for the credential to be issued. Object keys must match target credential schema.'
    })
    @IsObject() readonly entityData: object;
}
