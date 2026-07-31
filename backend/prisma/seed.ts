import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const demoHashedPassword = await bcrypt.hash('Demo123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aeroarcade.com' },
    update: {},
    create: {
      email: 'admin@aeroarcade.com',
      passwordHash: hashedPassword,
      displayName: 'Admin',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@aeroarcade.com' },
    update: {},
    create: {
      email: 'demo@aeroarcade.com',
      passwordHash: demoHashedPassword,
      displayName: 'Demo Player',
      role: UserRole.USER,
      isVerified: true,
    },
  });

  for (const user of [adminUser, demoUser]) {
    await prisma.practiceWallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: 10000,
        totalEarned: 10000,
        totalSpent: 0,
      },
    });

    await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });
  }

  const games = [
    {
      slug: 'flight-curve',
      name: 'Flight Curve',
      description: 'Predict the trajectory of a flight curve and cash out before it crashes.',
      category: 'crash',
      config: { minBet: 1, maxBet: 1000, maxMultiplier: 100 },
    },
    {
      slug: 'dice',
      name: 'Dice',
      description: 'Roll the dice and predict the outcome. Classic probability game.',
      category: 'dice',
      config: { minBet: 1, maxBet: 5000, sides: 6 },
    },
    {
      slug: 'coin-flip',
      name: 'Coin Flip',
      description: 'Heads or tails? A simple game of chance with 50/50 odds.',
      category: 'coinflip',
      config: { minBet: 1, maxBet: 2000 },
    },
    {
      slug: 'slots',
      name: 'Slots',
      description: 'Spin the reels and match symbols to win big.',
      category: 'slots',
      config: { minBet: 1, maxBet: 3000, reels: 3, symbols: 7 },
    },
    {
      slug: 'wheel',
      name: 'Wheel',
      description: 'Spin the wheel of fortune and test your luck.',
      category: 'wheel',
      config: { minBet: 1, maxBet: 2000, segments: 12 },
    },
    {
      slug: 'card-trainer',
      name: 'Card Trainer',
      description: 'Train your card counting skills with classic deck games.',
      category: 'cards',
      config: { minBet: 1, maxBet: 1000, decks: 1 },
    },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: game,
    });
  }

  const achievements = [
    {
      slug: 'first-flight',
      name: 'First Flight',
      description: 'Play your first game of Flight Curve',
      category: 'milestone',
      rewardPoints: 50,
    },
    {
      slug: 'lucky-streak',
      name: 'Lucky Streak',
      description: 'Win 5 games in a row',
      category: 'streak',
      rewardPoints: 200,
    },
    {
      slug: 'scholar',
      name: 'Scholar',
      description: 'Complete all educational lessons',
      category: 'education',
      rewardPoints: 500,
    },
    {
      slug: 'high-roller',
      name: 'High Roller',
      description: 'Bet 1000 points in a single game',
      category: 'milestone',
      rewardPoints: 150,
    },
    {
      slug: 'sharp-mind',
      name: 'Sharp Mind',
      description: 'Answer 10 quiz questions correctly',
      category: 'education',
      rewardPoints: 100,
    },
    {
      slug: 'persistent',
      name: 'Persistent',
      description: 'Play 100 games',
      category: 'milestone',
      rewardPoints: 300,
    },
    {
      slug: 'jackpot',
      name: 'Jackpot!',
      description: 'Win with a 10x multiplier or higher',
      category: 'special',
      rewardPoints: 400,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {},
      create: {
        ...achievement,
        criteria: {},
      },
    });
  }

  const lessons = [
    {
      slug: 'independent-events',
      title: 'Independent Events',
      description: 'Learn how independent events work and how to calculate their probabilities.',
      category: 'basics',
      difficulty: 'beginner',
      orderIndex: 1,
    },
    {
      slug: 'randomness',
      title: 'Randomness',
      description: 'Understand true randomness and how it applies to probability games.',
      category: 'theory',
      difficulty: 'beginner',
      orderIndex: 2,
    },
    {
      slug: 'house-advantage',
      title: 'House Advantage',
      description: 'Discover how the house edge works in probability-based games.',
      category: 'strategy',
      difficulty: 'intermediate',
      orderIndex: 3,
    },
    {
      slug: 'expected-value',
      title: 'Expected Value',
      description: 'Learn to calculate expected value and make informed betting decisions.',
      category: 'strategy',
      difficulty: 'intermediate',
      orderIndex: 4,
    },
    {
      slug: 'variance',
      title: 'Variance',
      description: 'Understand variance and why short-term results differ from expectations.',
      category: 'theory',
      difficulty: 'intermediate',
      orderIndex: 5,
    },
    {
      slug: 'gamblers-fallacy',
      title: "Gambler's Fallacy",
      description: 'Learn about the gambler\'s fallacy and why past outcomes don\'t affect future ones.',
      category: 'psychology',
      difficulty: 'beginner',
      orderIndex: 6,
    },
  ];

  for (const lesson of lessons) {
    await prisma.educationalLesson.upsert({
      where: { slug: lesson.slug },
      update: {},
      create: {
        ...lesson,
        content: {},
        isPublished: true,
      },
    });
  }

  const now = new Date();
  const challenge = await prisma.challenge.upsert({
    where: { slug: 'daily-practice' },
    update: {},
    create: {
      slug: 'daily-practice',
      title: 'Daily Practice',
      description: 'Play 10 games today to earn bonus points.',
      type: 'DAILY',
      requirements: { gamesToPlay: 10 },
      rewardPoints: 100,
      startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      isActive: true,
    },
  });

  const announcements = [
    {
      title: 'Welcome to AeroArcade!',
      content: 'Welcome! Start playing games and learning about probability. Earn points and climb the leaderboard.',
      type: 'INFO' as const,
      isActive: true,
    },
    {
      title: 'Scheduled Maintenance',
      content: 'The platform will be down for maintenance on Sunday from 2:00 AM to 4:00 AM UTC.',
      type: 'MAINTENANCE' as const,
      isActive: true,
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
    {
      title: 'New Feature: Challenge System',
      content: 'Complete daily and weekly challenges to earn bonus practice points!',
      type: 'INFO' as const,
      isActive: true,
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.create({ data: announcement });
  }

  const featureFlags = [
    { key: 'guest-mode', enabled: false, description: 'Allow users to play without registration' },
    { key: 'leaderboard', enabled: true, description: 'Enable global leaderboard' },
    { key: 'achievements', enabled: true, description: 'Enable achievement system' },
    { key: 'challenges', enabled: true, description: 'Enable daily/weekly challenges' },
    { key: 'education', enabled: true, description: 'Enable educational content' },
    { key: 'maintenance-mode', enabled: false, description: 'Put the platform in maintenance mode' },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
