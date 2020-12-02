import { IsArray, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardianOnboardPostReqDto {

    @ApiProperty({
        type: String,
        description: `The profile name of the json file stored on the server`
    })
    @IsString() readonly profile: string;

    @ApiProperty({
        type: Object,
        description: `Array of guardian data to onboard the entity. Should include 'pluginType', 'filters' and 'params'`
    })
    @IsArray() readonly guardianData: object[];

    @ApiProperty({
        type: Object,
        description: `The entity data for the credential to be issued. Object keys must match target credential schema.`
    })
    @IsObject() readonly entityData: object;
}
