import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EducationService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessons(category?: string) {
    const where: any = { isPublished: true };

    if (category) where.category = category;

    return this.prisma.educationalLesson.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
  }

  async getLesson(slug: string) {
    const lesson = await this.prisma.educationalLesson.findUnique({
      where: { slug },
      include: {
        quizzes: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            question: true,
            options: true,
            explanation: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async getQuizzes(lessonId: string) {
    const lesson = await this.prisma.educationalLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || !lesson.isPublished) {
      throw new NotFoundException('Lesson not found');
    }

    return this.prisma.quiz.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        question: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        orderIndex: true,
      },
    });
  }

  async submitQuizAttempt(
    userId: string,
    quizId: string,
    answers: Record<string, any>,
    score: number,
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { lesson: true },
    });

    if (!quiz || !quiz.lesson.isPublished) {
      throw new NotFoundException('Quiz not found');
    }

    return this.prisma.quizAttempt.create({
      data: { userId, quizId, answers, score },
    });
  }

  async getMyProgress(userId: string) {
    const [lessons, attempts] = await Promise.all([
      this.prisma.educationalLesson.findMany({
        where: { isPublished: true },
        orderBy: { orderIndex: 'asc' },
        include: {
          quizzes: {
            select: { id: true },
          },
        },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: { id: true, lessonId: true, question: true },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    const attemptMap = new Map<string, typeof attempts[0]>();
    for (const a of attempts) {
      if (!attemptMap.has(a.quizId)) {
        attemptMap.set(a.quizId, a);
      }
    }

    const lessonProgress = lessons.map((lesson) => {
      const lessonAttempts = attempts.filter(
        (a) => a.quiz.lessonId === lesson.id,
      );
      const completedQuizzes = new Set(
        lessonAttempts.map((a) => a.quizId),
      );
      const avgScore =
        lessonAttempts.length > 0
          ? Math.round(
              lessonAttempts.reduce((s, a) => s + a.score, 0) /
                lessonAttempts.length,
            )
          : 0;

      return {
        lessonId: lesson.id,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        totalQuizzes: lesson.quizzes.length,
        completedQuizzes: completedQuizzes.size,
        averageScore: avgScore,
        isCompleted: completedQuizzes.size >= lesson.quizzes.length,
      };
    });

    return {
      lessons: lessonProgress,
      totalCompletedQuizzes: new Set(attempts.map((a) => a.quizId)).size,
      totalAttempts: attempts.length,
    };
  }
}
