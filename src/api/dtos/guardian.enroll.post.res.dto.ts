import { ApiProperty } from '@nestjs/swagger';

export class GuardianEnrollPostResDto {

    @ApiProperty({
        type: String,
        description: 'The id of the newly enrolled agent'
    })
    readonly id: string;

    @ApiProperty({
        type: Object,
        description: 'Connection data to create a connection to the agent'
    })
    readonly connectionData: any;

}
