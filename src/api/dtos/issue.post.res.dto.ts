import { ApiProperty } from '@nestjs/swagger';

export class IssuePostResDto {

    @ApiProperty({
        type: String,
        description: `The id of the credential exchange`
    })
    readonly credential_exchange_id: string;

    @ApiProperty({
        type: String,
        description: `The state of the credential exchange. Note if the GET endpoint returns 404 that means the exchange has finished successfully and has been removed.`
    })
    readonly state: string;

}
