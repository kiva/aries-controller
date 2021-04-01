import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssueDeleteResDto {

    @ApiProperty({
        type: String,
        description: `The credential exchange ID supplied in the issued credential blob`
    })
    @IsString() readonly credExID : string;
}