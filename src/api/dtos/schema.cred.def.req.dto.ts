import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class SchemaCredDefReqDto {

    @ApiProperty({
        type: String,
        description: `Schema name, should contain no spaces`
    })
    @IsString() readonly schemaName: string;

    @ApiProperty({
        type: Object,
        description: `Array list of attribute names`,
        isArray: true
    })
    @IsArray() readonly attributes: Array<string>;

    @ApiProperty({
        type: String,
        description: `If no schemaId is provided then a new schema will be created. If it is provided then that existing schemaId will be used for the cred def.`,
        required: false
    })
    @IsOptional() @IsString() readonly schemaId: string;

    @ApiProperty({
        type: String,
        description: `(Optional) Provide a schema version, default: 1.0.0`,
        required: false,
        default: '1.0.0'
    })
    @IsOptional() @IsString() readonly schemaVersion: string;

    @ApiProperty({
        type: String,
        description: `(Optional) Provide a schema profile name to save to profile, by default it takes the schema name and added '.schema.json'`,
        required: false
    })
    @IsOptional() @IsString() readonly schemaProfileName: string;

    @ApiProperty({
        type: String,
        description: `(Optional) Provide a schema comment, this is saved to the profile`,
        required: false
    })
    @IsOptional() @IsString() readonly schemaComment: string;

    @ApiProperty({
        type: String,
        description: `(Optional) Provide a tag for the cred def, this is useful when there are multiple cred defs tied to the same schema. Defaults to 'tag1'`,
        required: false,
        default: 'tag1'
    })
    @IsOptional() @IsString() readonly tag: string;

    @ApiProperty({
        type: Boolean,
        description: `(Optional) Whether the cred def supports revocation. Defaults to false`,
        required: false
    })
    @IsOptional() @IsBoolean() readonly supportRevocation: boolean;

    @ApiProperty({
        type: String,
        description: `(Optional) The revocation registry size, only set if support revocation is true`,
        required: false
    })
    @IsOptional() @IsInt() readonly revocationRegistrySize: number;

    @ApiProperty({
        type: String,
        description: `(Optional) Provide a comment for the cred def to be saved to the profile`,
        required: false
    })
    @IsOptional() @IsString() readonly credDefcomment: string;

    @ApiProperty({
        type: String,
        description: `(Optional) Provide a custom cred def profile name. By default this will be the schema name plus .cred.def.json`,
        required: false
    })
    @IsOptional() @IsString() readonly credDefProfileName: string;

}
