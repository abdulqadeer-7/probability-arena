import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SupportTicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
