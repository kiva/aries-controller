import { ApiProperty } from '@nestjs/swagger';

export class VerifyGetResDto {

    @ApiProperty({
        type: String,
        description: `The state of the verify proof presentation exchange`
    })
    readonly state: string;

    @ApiProperty({
        type: Object,
        description: `The presentation object. The attributes can be found using presentation.requested_proof.revealed_attrs.{attribute_name}.raw.`
    })
    readonly presentation: object;

}
