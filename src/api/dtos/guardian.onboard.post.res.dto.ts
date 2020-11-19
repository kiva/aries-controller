import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardianOnboardPostResDto {

    @ApiProperty({
        type: String,
        description: 'The id of the newly onboarded agent'
    })
    @IsString() readonly agentId: string;

}
