'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Rocket,
  Dice1,
  Coins,
  Stars,
  Circle,
  SquareAsterisk,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';

interface GameCardData {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: typeof Rocket;
  isActive: boolean;
  color: string;
}

const GAMES: GameCardData[] = [
  {
    slug: 'flight-curve',
    name: 'Flight Curve',
    description: 'Watch a rocket soar and cash out before it crashes. Understand probability of timing and risk management.',
    category: 'numbers',
    icon: Rocket,
    isActive: true,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    slug: 'dice',
    name: 'Dice Roll',
    description: 'Predict dice outcomes and explore probability distributions with one or two dice.',
    category: 'dice',
    icon: Dice1,
    isActive: true,
    color: 'from-purple-500 to-pink-600',
  },
  {
    slug: 'coin-flip',
    name: 'Coin Flip',
    description: 'The classic 50/50. Double your money or lose it all.',
    category: 'numbers',
    icon: Coins,
    isActive: true,
    color: 'from-yellow-500 to-orange-600',
  },
  {
    slug: 'slots',
    name: 'Slot Simulator',
    description: 'Spin the reels and match symbols for big payouts.',
    category: 'other',
    icon: Stars,
    isActive: true,
    color: 'from-pink-500 to-rose-600',
  },
  {
    slug: 'wheel',
    name: 'Wheel Simulator',
    description: 'Spin the wheel and win up to 100x your bet.',
    category: 'wheel',
    icon: Circle,
    isActive: true,
    color: 'from-green-500 to-emerald-600',
  },
  {
    slug: 'card-trainer',
    name: 'Card Trainer',
    description: 'Draw cards and calculate probabilities. Learn about suits, values, and conditional probability.',
    category: 'cards',
    icon: SquareAsterisk,
    isActive: true,
    color: 'from-indigo-500 to-violet-600',
  },
];

const CATEGORIES = ['all', 'numbers', 'dice', 'cards', 'wheel', 'other'] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return GAMES.filter((g) => {
      const matchSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || g.category === category;
      return matchSearch && matchCategory;
    });
  }, [search, category]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorState
          title="Could not load games"
          description={error}
          onRetry={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <span className="text-gradient">Game Library</span>
        </h1>
        <p className="text-gray-400 max-w-xl">
          Explore probability and statistics through interactive games. All games use practice points with no monetary value.
        </p>
      </motion.div>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games by name or description..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aero-500"
            aria-label="Search games"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize',
                category === cat
                  ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/5',
              )}
            >
              {cat === 'all' ? 'All Games' : cat}
              <span className="sr-only">{cat === category ? ' (selected)' : ''}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Filter className="h-12 w-12 text-gray-500 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-300">No games found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search or filter.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {filtered.map((game) => {
            const Icon = game.icon;
            return (
              <motion.div key={game.slug} variants={item}>
                <Link
                  href={`/games/${game.slug}`}
                  className="group block h-full"
                  aria-label={`Play ${game.name}`}
                >
                  <div
                    className={cn(
                      'glass rounded-xl p-5 sm:p-6 h-full flex flex-col items-center text-center gap-4',
                      'transition-all duration-300 hover:border-aero-500/30',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aero-500',
                    )}
                    tabIndex={0}
                  >
                    <div
                      className={cn(
                        'flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br',
                        game.color,
                        'shadow-lg group-hover:scale-110 transition-transform duration-300',
                      )}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-aero-400 transition-colors truncate">
                        {game.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">
                        {game.category}
                      </Badge>
                      {game.isActive && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 p-6 rounded-xl glass text-center"
      >
        <p className="text-sm text-gray-400">
          <strong className="text-yellow-300">Educational Purpose:</strong> All games are designed to teach probability
          and statistics concepts. Practice points have no monetary value and cannot be exchanged for real money or
          anything of value.
        </p>
      </motion.div>
    </div>
  );
}
