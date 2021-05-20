import { ApiProperty } from '@nestjs/swagger';

export class RevokePostResDto {

    @ApiProperty({
        type: String,
        description: `the revoke json response blob`
    })
    readonly revokeJson: string;
}