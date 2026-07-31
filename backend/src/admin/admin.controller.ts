import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Ip,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SearchQueryDto, StatusFilterDto, AuditLogFilterDto } from './dto/pagination-query.dto';
import { UpdateGameConfigDto } from './dto/update-game-config.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { ToggleFeatureFlagDto } from './dto/toggle-feature-flag.dto';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  async listUsers(@Query() query: SearchQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.suspendUser(adminId, userId, ip);
  }

  @Patch('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.unsuspendUser(adminId, userId, ip);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Ip() ip: string,
  ) {
    return this.adminService.softDeleteUser(adminId, userId, ip);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('games')
  @HttpCode(HttpStatus.OK)
  async listGames() {
    return this.adminService.listGames();
  }

  @Patch('games/:id')
  @HttpCode(HttpStatus.OK)
  async updateGameConfig(
    @Param('id') id: string,
    @Body() dto: UpdateGameConfigDto,
  ) {
    return this.adminService.updateGameConfig(id, dto);
  }

  @Get('support-tickets')
  @HttpCode(HttpStatus.OK)
  async listSupportTickets(@Query() query: StatusFilterDto) {
    return this.adminService.listSupportTickets(query);
  }

  @Patch('support-tickets/:id')
  @HttpCode(HttpStatus.OK)
  async updateSupportTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.adminService.updateSupportTicket(id, dto);
  }

  @Get('announcements')
  @HttpCode(HttpStatus.OK)
  async listAnnouncements() {
    return this.adminService.listAnnouncements();
  }

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.adminService.createAnnouncement(dto);
  }

  @Patch('announcements/:id')
  @HttpCode(HttpStatus.OK)
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.adminService.updateAnnouncement(id, dto);
  }

  @Delete('announcements/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAnnouncement(@Param('id') id: string) {
    return this.adminService.deleteAnnouncement(id);
  }

  @Get('feature-flags')
  @HttpCode(HttpStatus.OK)
  async listFeatureFlags() {
    return this.adminService.listFeatureFlags();
  }

  @Patch('feature-flags/:id')
  @HttpCode(HttpStatus.OK)
  async toggleFeatureFlag(
    @Param('id') id: string,
    @Body() dto: ToggleFeatureFlagDto,
  ) {
    return this.adminService.toggleFeatureFlag(id, dto);
  }

  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  async listAuditLogs(@Query() query: AuditLogFilterDto) {
    return this.adminService.listAuditLogs(query);
  }

  @Get('health')
  @Public()
  @Roles()
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return this.adminService.getHealth();
  }
}
