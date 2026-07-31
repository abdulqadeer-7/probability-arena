import { IsString } from 'class-validator';

export class Setup2faDto {
  @IsString()
  token: string;
}
