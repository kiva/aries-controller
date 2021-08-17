import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * The only required field is agentId, the rest are optional and comprise the agent properties
 */
export class AgentRegisterReqDto {

    @ApiProperty({
        description: `Internal agentId (must be unique)`
    })
    @IsString() readonly agentId: string;
}
