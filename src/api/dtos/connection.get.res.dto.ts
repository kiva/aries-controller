import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectionGetResDto {

    @ApiProperty({
        type: String,
        description: `State values of 'active' or 'response' mean the connection is established. Other values indicate we're stilling waiting`
    })
    @IsString() readonly state: string;

}
