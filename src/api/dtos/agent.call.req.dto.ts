import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum HttpMethods {
    GET = 'GET',
    POST = 'POST',
    PATCH = 'PATCH',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export class AgentCallReqDto {

    @ApiProperty({
        description: `Method to be used for agent call`,
        enum: HttpMethods
    })
    @IsEnum(HttpMethods) readonly method: string;

    @ApiProperty({
        description: `Route on agent to call (eg 'status/ready')`
    })
    @IsString() readonly route: string;

    @ApiProperty({
        type: Object,
        required: false,
        description: `Params to be passed via url to agent`
    })
    @IsOptional() readonly params: any;

    @ApiProperty({
        type: Object,
        required: false,
        description: `Data to be passed in body of request to agent`
    })
    @IsOptional() readonly data: any;
}
