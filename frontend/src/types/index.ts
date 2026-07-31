export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'player' | 'admin' | 'moderator';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PracticeWallet {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarnings: number;
  lifetimeSpent: number;
  lastDailyBonusAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeTransaction {
  id: string;
  walletId: string;
  type: 'earned' | 'spent' | 'bonus' | 'refund' | 'penalty';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  category: 'cards' | 'dice' | 'wheel' | 'numbers' | 'skill' | 'other';
  thumbnailUrl: string | null;
  minBet: number;
  maxBet: number;
  rules: string;
  isActive: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GameRound {
  id: string;
  gameId: string;
  userId: string;
  betAmount: number;
  payoutMultiplier: number;
  result: 'win' | 'lose' | 'draw' | 'pending';
  payout: number;
  gameData: Record<string, unknown>;
  createdAt: string;
}

export interface GameResult {
  roundId: string;
  gameId: string;
  gameName: string;
  betAmount: number;
  result: 'win' | 'lose' | 'draw' | 'pending';
  payout: number;
  payoutMultiplier: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  criteria: Record<string, unknown>;
  rewardPoints: number;
  isHidden: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  gameId: string;
  game: Game | null;
  type: 'daily' | 'weekly' | 'special' | 'competitive';
  criteria: Record<string, unknown>;
  rewardPoints: number;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface ChallengeProgress {
  id: string;
  challengeId: string;
  userId: string;
  challenge: Challenge;
  progress: number;
  target: number;
  isCompleted: boolean;
  rank: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  gamesPlayed: number;
  winRate: number;
  totalEarnings: number;
  rank: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'achievement' | 'challenge' | 'reward' | 'system' | 'promotion';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface EducationalLesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: 'probability' | 'strategy' | 'game_rules' | 'bankroll';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: number[];
  isPassed: boolean;
  attemptedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
