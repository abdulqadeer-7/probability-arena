import { IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateGameConfigDto {
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
