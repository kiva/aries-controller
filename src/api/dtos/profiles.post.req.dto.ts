import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';



export class ProfilesPostReqDto {

    @ApiProperty({
        description: `The name of the profile to save, generally in the form "entity.topic.function.json"`
    })
    @IsString() readonly profileName: string;


    @ApiProperty({
        type: Object,
        description: `The profile in JSON format`
    })
    readonly profile: any;
}
