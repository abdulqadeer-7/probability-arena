import { IsString, MinLength, MaxLength, Matches, IsOptional, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Display name must be alphanumeric' })
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
