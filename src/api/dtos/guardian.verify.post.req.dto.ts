import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardianVerifyPostReqDto {

    @ApiProperty({
        type: String,
        description: `The profile name of the json file stored on the server`
    })
    @IsString() readonly profile: string;

    @ApiProperty({
        type: Object,
        description: `The guardian data to onboard the entity. Should include 'pluginType', 'filters' and 'params'`
    })
    @IsObject() readonly guardianData: object[];

}
