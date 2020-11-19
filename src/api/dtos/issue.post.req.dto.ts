import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssuePostReqDto {

    @ApiProperty({
        type: String,
        description: `The profile name of the json file stored on the server`
    })
    @IsString() readonly profile: string;

    @ApiProperty({
        type: String,
        description: `The connection id of an established agent connection`
    })
    @IsString() readonly connectionId: string;

    @ApiProperty({
        type: Object,
        description: `The entity data for the credential to be issued. Object keys must match target credential schema.`
    })
    @IsObject() readonly entityData: object;
}
