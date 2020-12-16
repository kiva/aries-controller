import { ApiProperty } from '@nestjs/swagger';

export class VerifyPostResDto {

    @ApiProperty({
        type: String,
        description: `The id of the verify proof presentation exchange`
    })
    readonly presentation_exchange_id: string;

    @ApiProperty({
        type: String,
        description: `The state of the verify proof presentation exchange`
    })
    readonly state: string;

}
