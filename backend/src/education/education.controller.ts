import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Get('lessons')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getLessons(@Query('category') category?: string) {
    return this.educationService.getLessons(category);
  }

  @Get('lessons/:slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getLesson(@Param('slug') slug: string) {
    return this.educationService.getLesson(slug);
  }

  @Get('lessons/:slug/quiz')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getQuizzes(@Param('slug') slug: string) {
    const lesson = await this.educationService.getLesson(slug);
    return this.educationService.getQuizzes(lesson.id);
  }

  @Post('quiz/:id/attempt')
  @HttpCode(HttpStatus.CREATED)
  async submitQuizAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') quizId: string,
    @Body('answers') answers: Record<string, any>,
    @Body('score') score: number,
  ) {
    return this.educationService.submitQuizAttempt(userId, quizId, answers, score);
  }

  @Get('progress')
  @HttpCode(HttpStatus.OK)
  async getMyProgress(@CurrentUser('id') userId: string) {
    return this.educationService.getMyProgress(userId);
  }
}
