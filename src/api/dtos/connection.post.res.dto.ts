import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectionPostResDto {

    @ApiProperty({
        type: String,
        description: 'Connection id string for the underlying agent'
    })
    @IsString() readonly connection_id: string;

    @ApiProperty({
        type: Object,
        description: 'Invitation object to connect with the underlying agent'
    })
    @IsObject() readonly invitation: object;

}
