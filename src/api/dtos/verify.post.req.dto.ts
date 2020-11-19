import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPostReqDto {

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

}
