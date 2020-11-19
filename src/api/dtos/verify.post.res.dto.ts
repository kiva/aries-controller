import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPostResDto {

    @ApiProperty({
        type: String,
        description: `The id of the verify proof presentation exchange`
    })
    @IsString() readonly presentation_exchange_id: string;

    @ApiProperty({
        type: String,
        description: `The state of the verify proof presentation exchange`
    })
    @IsString() readonly state: string;

}
