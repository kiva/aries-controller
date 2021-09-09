import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Fields to register an agent
 */
export class AgentRegisterReqDto {

    @ApiProperty({
        description: `Label for agent (can be multiple words)`
    })
    @IsString() readonly label: string;

    @ApiProperty({
        description: `Single agent only. Pass a seed to use for DID generation (Optional)`,
        required: false,
    })
    @IsString() @IsOptional() readonly seed: string;

    @ApiProperty({
        description: `Single agent only. Pass an adminApiKey to use for controlling the individual agent (Optional)`,
        required: false,
    })
    @IsString() @IsOptional() readonly adminApiKey: string;

    @ApiProperty({
        description: `Single agent only. Whether the agent should be configured to use a tails server (Optional)`,
        required: false,
    })
    @IsBoolean() @IsOptional() readonly useTailsServer: boolean;
}
