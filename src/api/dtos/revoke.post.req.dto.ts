import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RevokePostReqDto {

    @ApiProperty({
        type: String,
        description: 'Credential exchange ID for the credential that will be revoked'
    })
    @IsString() readonly credentialExchangeId: string;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Boolean that decides if this revoke credential should this credential be published to the ledger',
        default: true
    })
    @IsOptional() @IsBoolean() readonly publish: boolean;

}