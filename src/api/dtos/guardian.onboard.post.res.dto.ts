import { ApiProperty } from '@nestjs/swagger';

export class GuardianOnboardPostResDto {

    @ApiProperty({
        type: String,
        description: 'The id of the newly onboarded agent'
    })
    readonly agentId: string;

    @ApiProperty({
        type: Object,
        description: 'Data returned from the agent'
    })
    readonly agentData: any;

}
