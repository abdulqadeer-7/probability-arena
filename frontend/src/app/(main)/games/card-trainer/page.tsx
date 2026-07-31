'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquareAsterisk,
  Shuffle,
  TrendingUp,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency, randomId } from '@/lib/utils';
import { BalanceDisplay } from '@/components/games/BalanceDisplay';
import { BetControls } from '@/components/games/BetControls';
import { RoundHistory } from '@/components/games/RoundHistory';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
type Suit = typeof SUITS[number];
type Value = typeof VALUES[number];

interface Card {
  suit: Suit;
  value: Value;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

type PredictMode = 'color' | 'suit' | 'highlow';

const COLOR_MAP: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

const HIGH_VALUES = ['10', 'J', 'Q', 'K', 'A'];
const LOW_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9'];

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function generateQuizQuestion(deck: Card[]): QuizQuestion {
  const remaining = deck.length;
  if (remaining === 0) {
    return {
      question: 'Deck is empty. Reset and try again!',
      options: ['Yes', 'No'],
      correctIndex: 0,
      explanation: 'The deck has no cards left.',
    };
  }
  const questionType = Math.floor(Math.random() * 3);
  const redCount = deck.filter((c) => COLOR_MAP[c.suit] === 'red').length;
  const blackCount = deck.filter((c) => COLOR_MAP[c.suit] === 'black').length;

  if (questionType === 0) {
    const prob = ((redCount / remaining) * 100).toFixed(1);
    return {
      question: `What is the probability of drawing a RED card? (${redCount} red, ${remaining} total)`,
      options: [`${prob}%`, `${(100 - parseFloat(prob)).toFixed(1)}%`, '50%', '25%'],
      correctIndex: 0,
      explanation: `${redCount} red cards out of ${remaining} total cards = ${prob}%`,
    };
  } else if (questionType === 1) {
    const suit = SUITS[Math.floor(Math.random() * 4)];
    const suitCount = deck.filter((c) => c.suit === suit).length;
    const prob = ((suitCount / remaining) * 100).toFixed(1);
    const wrongProbs = [
      ((SUITS.filter((s) => s !== suit).map((s) => deck.filter((c) => c.suit === s).length).reduce((a, b) => a + b, 0) / remaining) * 100).toFixed(1),
      ((deck.filter((c) => COLOR_MAP[c.suit] === 'red').length / remaining) * 100).toFixed(1),
      '25%',
    ];
    return {
      question: `What is the probability of drawing ${suit}? (${suitCount} ${suit}, ${remaining} total)`,
      options: [`${prob}%`, ...wrongProbs],
      correctIndex: 0,
      explanation: `${suitCount} ${suit} cards out of ${remaining} = ${prob}%`,
    };
  } else {
    const highCount = deck.filter((c) => HIGH_VALUES.includes(c.value)).length;
    const lowCount = deck.filter((c) => LOW_VALUES.includes(c.value)).length;
    const prob = ((highCount / remaining) * 100).toFixed(1);
    return {
      question: `What is the probability of drawing a HIGH card (10-A)? (${highCount} high, ${remaining} total)`,
      options: [`${prob}%`, `${((lowCount / remaining) * 100).toFixed(1)}%`, '50%', `${((13 / remaining) * 100).toFixed(1)}%`],
      correctIndex: 0,
      explanation: `${highCount} high cards out of ${remaining} = ${prob}%`,
    };
  }
}

function getCardDisplay(card: Card): { symbol: string; color: string; label: string } {
  const suitSymbols: Record<Suit, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
  };
  return {
    symbol: suitSymbols[card.suit],
    color: COLOR_MAP[card.suit] === 'red' ? '#ef4444' : '#111827',
    label: `${card.value}${suitSymbols[card.suit]}`,
  };
}

export default function CardTrainerPage() {
  const { wallet, updateWallet, addRound } = useGameStore();
  const [deck, setDeck] = useState<Card[]>(() => shuffleDeck(createDeck()));
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [predictMode, setPredictMode] = useState<PredictMode>('color');
  const [history, setHistory] = useState<{ card: Card; correct: boolean; prediction: string }[]>([]);
  const [score, setScore] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [shuffling, setShuffling] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const remainingCount = deck.length;

  const probabilities = useMemo(() => {
    const red = deck.filter((c) => COLOR_MAP[c.suit] === 'red').length;
    const black = deck.filter((c) => COLOR_MAP[c.suit] === 'black').length;
    const suits: Record<string, number> = {};
    const high = deck.filter((c) => HIGH_VALUES.includes(c.value)).length;
    const low = deck.filter((c) => LOW_VALUES.includes(c.value)).length;
    for (const s of SUITS) {
      suits[s] = deck.filter((c) => c.suit === s).length;
    }
    return { red, black, suits, high, low, total: deck.length };
  }, [deck]);

  const drawCard = useCallback(() => {
    if (deck.length === 0) return;
    setShowCard(false);
    const card = deck[deck.length - 1];
    setDeck((d) => d.slice(0, -1));
    setDrawnCard(card);
    setTimeout(() => setShowCard(true), 300);
  }, [deck]);

  const handlePredict = useCallback((prediction: string) => {
    if (!drawnCard || showCard) return;
    setShowCard(true);

    let correct = false;
    if (predictMode === 'color') {
      correct = prediction === COLOR_MAP[drawnCard.suit];
    } else if (predictMode === 'suit') {
      correct = prediction === drawnCard.suit;
    } else if (predictMode === 'highlow') {
      const isHigh = HIGH_VALUES.includes(drawnCard.value);
      const isLow = LOW_VALUES.includes(drawnCard.value);
      if (prediction === 'high') correct = isHigh;
      else if (prediction === 'low') correct = isLow;
    }

    setScore((s) => s + (correct ? 1 : 0));
    setTotalGuesses((g) => g + 1);
    setHistory((h) => [{ card: drawnCard, correct, prediction }, ...h].slice(0, 30));

    if (wallet) {
      addRound({
        id: randomId(),
        gameId: 'card-trainer',
        userId: wallet.userId,
        betAmount: 0,
        payoutMultiplier: correct ? 1 : 0,
        result: correct ? 'win' : 'lose',
        payout: correct ? 10 : 0,
        gameData: { card: drawnCard, prediction, correct },
        createdAt: new Date().toISOString(),
      });
    }
  }, [drawnCard, showCard, predictMode, wallet, addRound]);

  const resetDeck = useCallback(() => {
    setShuffling(true);
    setTimeout(() => {
      setDeck(shuffleDeck(createDeck()));
      setDrawnCard(null);
      setShowCard(false);
      setShuffling(false);
      setHistory([]);
      setScore(0);
      setTotalGuesses(0);
    }, 800);
  }, []);

  const startQuiz = useCallback(() => {
    setQuizMode(true);
    setQuizAnswered(false);
    setQuizQuestion(generateQuizQuestion(deck));
  }, [deck]);

  const answerQuiz = useCallback((index: number) => {
    if (!quizQuestion || quizAnswered) return;
    setQuizAnswered(true);
    const correct = index === quizQuestion.correctIndex;
    setQuizCorrect(correct);
    setQuizScore((s) => s + (correct ? 1 : 0));
    setQuizTotal((t) => t + 1);
  }, [quizQuestion, quizAnswered]);

  const nextQuiz = useCallback(() => {
    setQuizAnswered(false);
    setQuizQuestion(generateQuizQuestion(deck));
  }, [deck]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorState title="Something went wrong" description={error} onRetry={() => setError(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <SquareAsterisk className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-gradient">Card Trainer</span>
              </h1>
              <p className="text-sm text-gray-400">Conditional Probability & Deck Composition</p>
            </div>
          </div>
          <button
            onClick={() => setQuizMode(!quizMode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              quizMode ? 'bg-aero-500/20 text-aero-400 border-aero-500/30' : 'bg-white/5 text-gray-400 border-white/10',
            )}
            aria-label="Toggle quiz mode"
          >
            <Brain className="h-3.5 w-3.5" aria-hidden="true" />
            Quiz
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6"
          >
            {quizMode ? (
              <div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Probability Quiz</h3>
                {quizQuestion && (
                  <div>
                    <p className="text-gray-300 mb-4">{quizQuestion.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {quizQuestion.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => answerQuiz(i)}
                          disabled={quizAnswered}
                          className={cn(
                            'px-4 py-3 rounded-lg text-sm font-medium transition-all border text-left',
                            quizAnswered
                              ? i === quizQuestion.correctIndex
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : quizCorrect === false && i === quizQuestion.correctIndex
                                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                  : 'bg-white/5 border-white/10 text-gray-400'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10',
                          )}
                        >
                          {opt}
                          {quizAnswered && i === quizQuestion.correctIndex && (
                            <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-400" aria-hidden="true" />
                          )}
                          {quizAnswered && quizCorrect === false && i !== quizQuestion.correctIndex && (
                            <XCircle className="inline h-4 w-4 ml-2 text-red-400" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                    {quizAnswered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass rounded-lg p-3 mb-4"
                      >
                        <p className={cn('text-sm font-medium', quizCorrect ? 'text-green-400' : 'text-red-400')}>
                          {quizCorrect ? 'Correct!' : 'Incorrect.'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{quizQuestion.explanation}</p>
                        <button
                          onClick={nextQuiz}
                          className="mt-2 px-4 py-1.5 rounded-lg bg-aero-500/20 text-aero-400 text-sm hover:bg-aero-500/30 transition-colors"
                        >
                          Next Question
                        </button>
                      </motion.div>
                    )}
                    <div className="text-xs text-gray-500">
                      Quiz Score: {quizScore}/{quizTotal} ({quizTotal > 0 ? ((quizScore / quizTotal) * 100).toFixed(0) : 0}%)
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setQuizMode(false)}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Back to Card Trainer
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  {(['color', 'suit', 'highlow'] as PredictMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setPredictMode(mode); setDrawnCard(null); setShowCard(false); }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                        predictMode === mode ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30' : 'bg-white/5 text-gray-400',
                      )}
                    >
                      {mode === 'highlow' ? 'High/Low' : mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center h-48 mb-6">
                  <AnimatePresence mode="wait">
                    {shuffling ? (
                      <motion.div
                        key="shuffling"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-aero-400"
                      >
                        <Shuffle className="h-6 w-6 animate-spin" aria-hidden="true" />
                        <span>Shuffling...</span>
                      </motion.div>
                    ) : drawnCard && showCard ? (
                      <motion.div
                        key={`${drawnCard.value}-${drawnCard.suit}`}
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          'w-28 h-40 sm:w-32 sm:h-44 rounded-xl border-2 flex flex-col items-center justify-center shadow-2xl',
                          COLOR_MAP[drawnCard.suit] === 'red' ? 'bg-white border-red-300' : 'bg-white border-gray-300',
                        )}
                        role="img"
                        aria-label={`${drawnCard.value} of ${drawnCard.suit}`}
                      >
                        <span className="text-lg sm:text-xl font-bold" style={{ color: getCardDisplay(drawnCard).color }}>
                          {drawnCard.value}
                        </span>
                        <span className="text-2xl sm:text-3xl" style={{ color: getCardDisplay(drawnCard).color }}>
                          {getCardDisplay(drawnCard).symbol}
                        </span>
                        <span className="text-xs text-gray-500 capitalize mt-1">{drawnCard.suit}</span>
                      </motion.div>
                    ) : drawnCard ? (
                      <motion.div
                        key="back"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-28 h-40 sm:w-32 sm:h-44 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 border-2 border-indigo-400 flex items-center justify-center shadow-2xl"
                      >
                        <SquareAsterisk className="h-8 w-8 text-indigo-300" aria-hidden="true" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center text-gray-400"
                      >
                        <SquareAsterisk className="h-12 w-12 mb-2" aria-hidden="true" />
                        <p className="text-sm">Draw a card to begin</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {drawnCard && !showCard && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    {predictMode === 'color' && (
                      <>
                        <button onClick={() => handlePredict('red')} className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 border border-red-500/30 transition-all">Red</button>
                        <button onClick={() => handlePredict('black')} className="px-6 py-3 rounded-xl bg-gray-500/20 text-gray-300 font-bold text-sm hover:bg-gray-500/30 border border-gray-500/30 transition-all">Black</button>
                      </>
                    )}
                    {predictMode === 'suit' && SUITS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handlePredict(s)}
                        className="px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all border"
                        style={{
                          backgroundColor: `${COLOR_MAP[s] === 'red' ? '#ef4444' : '#374151'}20`,
                          color: COLOR_MAP[s] === 'red' ? '#ef4444' : '#d1d5db',
                          borderColor: `${COLOR_MAP[s] === 'red' ? '#ef4444' : '#6b7280'}30`,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                    {predictMode === 'highlow' && (
                      <>
                        <button onClick={() => handlePredict('high')} className="px-6 py-3 rounded-xl bg-green-500/20 text-green-400 font-bold text-sm hover:bg-green-500/30 border border-green-500/30 transition-all">High (10-A)</button>
                        <button onClick={() => handlePredict('low')} className="px-6 py-3 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold text-sm hover:bg-yellow-500/30 border border-yellow-500/30 transition-all">Low (2-9)</button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={drawCard}
                    disabled={remainingCount === 0 || shuffling}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-aero-500 to-accent-500 text-white font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-aero-500/20"
                    aria-label="Draw a card"
                  >
                    Draw Card ({remainingCount} left)
                  </button>
                  <button
                    onClick={resetDeck}
                    disabled={shuffling}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-all"
                    aria-label="Reset deck"
                  >
                    <RefreshCw className={cn('h-4 w-4 inline mr-1', shuffling && 'animate-spin')} aria-hidden="true" />
                    Reset
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {!quizMode && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4">
                <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Deck Composition</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-400">Red</span>
                    <span className="tabular-nums">{probabilities.red}/{probabilities.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Black</span>
                    <span className="tabular-nums">{probabilities.black}/{probabilities.total}</span>
                  </div>
                  {SUITS.map((s) => (
                    <div key={s} className="flex justify-between">
                      <span className="capitalize text-gray-400">{s}</span>
                      <span className="tabular-nums">{probabilities.suits[s]}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-yellow-400">High</span>
                    <span className="tabular-nums">{probabilities.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Low</span>
                    <span className="tabular-nums">{probabilities.low}</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Your Score</h4>
                <p className="text-3xl font-bold text-aero-400 tabular-nums">{score}</p>
                <p className="text-sm text-gray-400">
                  {totalGuesses > 0 ? `${Math.round((score / totalGuesses) * 100)}%` : 'No guesses yet'}
                </p>
                <p className="text-xs text-gray-500">
                  {totalGuesses} / {totalGuesses + history.filter((h) => !h.correct).length} correct
                </p>
              </div>

              {history.length > 0 && (
                <div className="glass rounded-xl p-4">
                  <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Last Draws</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                    {history.slice(0, 10).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span style={{ color: getCardDisplay(h.card).color }} className="font-mono">
                          {getCardDisplay(h.card).label}
                        </span>
                        <span className={cn(h.correct ? 'text-green-400' : 'text-red-400')}>
                          {h.correct ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <RoundHistory />
        </div>

        <div className="space-y-6">
          <BalanceDisplay />
          <BetControls onPlaceBet={() => {}} disabled />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              Card Probability
            </h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                <strong>Conditional Probability:</strong> Each draw changes the deck composition.
                Drawing a red card makes the next card slightly more likely to be black.
              </p>
              <p>
                <strong>Without Replacement:</strong> Unlike coin flips, card draws are dependent events.
                The probability changes as cards are removed from the deck.
              </p>
              <p>
                <strong>Initial Odds:</strong> Red/Black (50/50), any specific suit (1/4 = 25%),
                High vs Low (20 high, 32 low in full deck).
              </p>
              <p className="text-yellow-300/70 mt-2">
                Try Quiz Mode to test your probability calculation skills!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
