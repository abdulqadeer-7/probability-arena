import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class BetDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  clientSeed?: string;
}
