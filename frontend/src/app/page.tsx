'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Rocket,
  Dice1,
  Swords,
  Brain,
  BarChart3,
  Shield,
  Sparkles,
  ChevronDown,
  Play,
  BookOpen,
  Infinity,
  Target,
  Zap,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';

const games = [
  {
    title: 'FlipFate',
    description: 'A classic card prediction game. Test your luck and win big.',
    icon: Dice1,
    gradient: 'from-aero-500 to-cyan-600',
    slug: 'flip-fate',
  },
  {
    title: 'DuelRoll',
    description: 'High-stakes dice battles with massive payouts.',
    icon: Swords,
    gradient: 'from-accent-500 to-orange-600',
    slug: 'duel-roll',
  },
  {
    title: 'SpinWise',
    description: 'Spin the wheel and watch your winnings multiply.',
    icon: Target,
    gradient: 'from-purple-500 to-pink-600',
    slug: 'spin-wise',
  },
  {
    title: 'NumberNexus',
    description: 'Predict the numbers and cash out at the right moment.',
    icon: BarChart3,
    gradient: 'from-green-500 to-emerald-600',
    slug: 'number-nexus',
  },
  {
    title: 'QuantQuotient',
    description: 'Quick-fire guessing game with rising multipliers.',
    icon: Brain,
    gradient: 'from-blue-500 to-indigo-600',
    slug: 'quant-quotient',
  },
  {
    title: 'Arena',
    description: 'Compete against other players in real-time for the grand prize.',
    icon: Zap,
    gradient: 'from-rose-500 to-red-600',
    slug: 'arena',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

function FeatureCard({ game, index }: { game: typeof games[0]; index: number }) {
  const ref = useState<HTMLDivElement | null>(null);
  const setRef = useCallback((node: HTMLDivElement | null) => {
    ref[1](node);
  }, []);
  const isInView = useInView({ current: ref[0] as Element | null } as React.RefObject<Element>, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={setRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link
        href={`/games/${game.slug}`}
        className="group relative block rounded-2xl glass border border-glass-border dark:border-glass-border-dark p-6 hover:glass-hover transition-all duration-300"
      >
        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', game.gradient)}>
          <game.icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-aero-500 transition-colors">{game.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{game.description}</p>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-aero-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-3 w-3" aria-hidden="true" />
          Play Now
        </div>
      </Link>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 w-3/4 mx-auto rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-6 w-1/2 mx-auto rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="flex justify-center gap-4 mt-8">
        <div className="h-12 w-36 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-12 w-36 rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl glass p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-5 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-4/5 rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center" role="alert">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <Shield className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        We encountered an issue loading the page. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-aero-500 to-accent-500 hover:from-aero-600 hover:to-accent-600 transition-all shadow-lg shadow-aero-500/20"
      >
        {t('common.retry')}
      </button>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const heroRef = useState<HTMLDivElement | null>(null);
  const setHeroRef = useCallback((node: HTMLDivElement | null) => {
    heroRef[1](node);
  }, []);
  const heroInView = useInView({ current: heroRef[0] as Element | null } as React.RefObject<Element>, { once: true });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = useCallback(() => {
    setError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (error) {
    return <ErrorState onRetry={handleRetry} />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <Skeleton />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-dot pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-aero-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" aria-hidden="true" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} aria-hidden="true" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '3s' }} aria-hidden="true" />

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32" ref={setHeroRef}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aero-500 to-accent-500 shadow-2xl shadow-aero-500/20"
            >
              <Rocket className="h-8 w-8 text-white" aria-hidden="true" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-gradient">AeroArcade</span>
              <br />
              <span>Play. Win. Repeat.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
              Your ultimate destination for thrilling casino games. Deposit, play, and win big across
              a variety of exciting games — all with provably fair outcomes.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-aero-500 to-accent-500 hover:from-aero-600 hover:to-accent-600 transition-all shadow-xl shadow-aero-500/25 hover:shadow-aero-500/40 hover:-translate-y-0.5"
              >
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                Start Playing
              </Link>
              <Link
                href="#games"
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-base font-medium glass hover:glass-hover transition-all hover:-translate-y-0.5"
              >
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                Explore Games
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-400 dark:text-gray-500"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" aria-hidden="true" />
                Provably Fair
              </span>
              <span className="flex items-center gap-1.5">
                <Infinity className="h-4 w-4 text-aero-500" aria-hidden="true" />
                Instant Withdrawals
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent-500" aria-hidden="true" />
                Big Wins
              </span>
            </motion.div>
          </motion.div>
        </section>

        <section id="games" className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Explore <span className="text-gradient">Games</span>
            </h2>
            <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
              From classic card games to high-stakes dice battles — find your game and start winning.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <FeatureCard key={game.slug} game={game} index={index} />
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-aero-500 mb-4">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Premium Casino
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Where <span className="text-gradient">Thrills</span> Meet Big Wins
              </h2>
              <div className="space-y-4 text-gray-500 dark:text-gray-400">
                <p className="leading-relaxed">
                  AeroArcade brings you the best casino experience with a wide variety of games.
                  From card games to dice, slots to wheel spins — every game offers fair odds
                  and exciting payouts.
                </p>
                <p className="leading-relaxed">
                  Deposit securely, play your favorite games, and withdraw your winnings instantly.
                  Our provably fair system ensures every outcome is transparent and verifiable.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: '6+', label: 'Games', icon: Gamepad2 },
                  { value: '0', label: 'House Edge', icon: Coins },
                  { value: '100%', label: 'Fair', icon: Shield },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-xl glass">
                    <div className="flex justify-center mb-2">
                      <stat.icon className="h-5 w-5 text-aero-500" aria-hidden="true" />
                    </div>
                    <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="relative"
            >
              <div className="relative rounded-2xl glass border border-glass-border dark:border-glass-border-dark p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-aero-500/5 to-accent-500/5 pointer-events-none" aria-hidden="true" />
                <div className="relative space-y-6">
                  <h3 className="text-xl font-semibold">How It Works</h3>
                  {[
                    { step: '01', title: 'Deposit Funds', desc: 'Add funds securely to your account and claim your bonus.' },
                    { step: '02', title: 'Pick a Game', desc: 'Choose from our collection of exciting casino games.' },
                    { step: '03', title: 'Win & Withdraw', desc: 'Play, win, and withdraw your earnings instantly.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-aero-500 to-accent-500 text-xs font-bold text-white">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl glass border border-glass-border dark:border-glass-border-dark p-8 sm:p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-aero-500/5 to-accent-500/5 pointer-events-none" aria-hidden="true" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <HeartHandshake className="h-6 w-6 text-green-500" aria-hidden="true" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Responsible Gaming</h2>
              <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400 leading-relaxed">
                AeroArcade promotes responsible gaming. Set your limits, play within your means, and
                never chase losses. If you or someone you know needs help with problem gambling, please
                seek professional support. This is a real-money gaming platform — play responsibly.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Responsible Play', 'Privacy Policy', 'Terms of Service', 'Fairness'].map((label) => (
                  <Link
                    key={label}
                    href={`/${label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-4 py-2 rounded-lg text-xs font-medium glass hover:glass-hover transition-all"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <div className="text-center pb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-aero-500 to-accent-500 hover:from-aero-600 hover:to-accent-600 transition-all shadow-2xl shadow-aero-500/30 hover:shadow-aero-500/50 hover:-translate-y-0.5"
            >
              <Rocket className="h-5 w-5" aria-hidden="true" />
              Start Playing Now
            </Link>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

function Gamepad2(props: React.ComponentProps<typeof Swords>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" x2="10" y1="11" y2="11" />
      <line x1="8" x2="8" y1="9" y2="13" />
      <line x1="15" x2="15.01" y1="12" y2="12" />
      <line x1="18" x2="18.01" y1="10" y2="10" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </svg>
  );
}
function Coins(props: React.ComponentProps<typeof Swords>) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>; }
function HeartHandshake(props: React.ComponentProps<typeof Swords>) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/></svg>; }
