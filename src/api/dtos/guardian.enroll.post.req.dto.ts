import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardianEnrollPostReqDto {

    @ApiProperty({
        type: Object,
        description: 'Array of guardian data to enroll the entity. Should include \'pluginType\', \'filters\' and \'params\''
    })
    @IsArray() readonly guardianData: object[];
}
