'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { get, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  ArrowLeft, ArrowRight, Check, X, RotateCcw, Trophy,
  BookOpen, Clock, ChevronRight, Award,
} from 'lucide-react';
import type { EducationalLesson, Quiz, QuizQuestion, QuizAttempt } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const difficultyConfig = {
  beginner: { label: 'Beginner', variant: 'success' as const },
  intermediate: { label: 'Intermediate', variant: 'warning' as const },
  advanced: { label: 'Advanced', variant: 'danger' as const },
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [lesson, setLesson] = useState<EducationalLesson | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [allLessons, setAllLessons] = useState<EducationalLesson[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const [lessonData, allData] = await Promise.all([
          get<EducationalLesson>(`/learn/lessons/${slug}`),
          get<EducationalLesson[]>('/learn/lessons', { isPublished: true }),
        ]);
        setLesson(lessonData);
        setAllLessons(allData);

        try {
          const quizData = await get<Quiz>(`/learn/lessons/${slug}/quiz`);
          setQuiz(quizData);
        } catch {
          // no quiz for this lesson
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [slug]);

  const currentIndex = allLessons.findIndex((l) => l.slug === slug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setAnswers(new Array(quiz?.questions.length || 0).fill(-1));
    setShowResult(false);
    setScore(0);
    setCurrentQuestion(0);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 1) - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz) return;
    setSubmitting(true);
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    const finalScore = Math.round((correct / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResult(true);

    try {
      const attemptData = await post<QuizAttempt>(`/learn/lessons/${slug}/quiz/attempt`, {
        quizId: quiz.id,
        answers,
      });
      setAttempt(attemptData);
    } catch {
      // store locally
    }
    setSubmitting(false);
  }, [quiz, answers, slug]);

  const handleRetry = () => {
    handleStartQuiz();
  };

  if (isLoading) {
    return <LessonSkeleton />;
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load lesson" description={error || 'Lesson not found'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const diffConfig = difficultyConfig[lesson.difficulty] || difficultyConfig.beginner;

  const chartData = [
    { name: 'Outcome A', probability: 0.25 },
    { name: 'Outcome B', probability: 0.5 },
    { name: 'Outcome C', probability: 0.25 },
  ];

  const pieColors = ['#06b6d4', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-4xl space-y-8"
      >
        <motion.div variants={itemVariants}>
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Centre
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Badge variant={diffConfig.variant}>{diffConfig.label}</Badge>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {lesson.estimatedMinutes} min
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-100">{lesson.title}</h1>
          <p className="mt-2 text-gray-400">{lesson.description}</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300 leading-relaxed">
              {lesson.content.split('\n\n').map((section, i) => {
                if (section.startsWith('## ')) {
                  return (
                    <h2 key={i} className="text-xl font-semibold text-gray-100 mt-8 mb-4">
                      {section.replace('## ', '')}
                    </h2>
                  );
                }
                if (section.startsWith('- ')) {
                  return (
                    <ul key={i} className="list-disc pl-6 space-y-2">
                      {section.split('\n').map((line, j) => (
                        <li key={j}>{line.replace('- ', '')}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i}>{section}</p>;
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Probability Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                />
                <Bar dataKey="probability" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Outcome Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="probability"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, probability }) => `${name}: ${(probability * 100)}%`}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Expected Value Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={Array.from({ length: 50 }, (_, i) => ({
                  trial: i + 1,
                  value: Math.random() > 0.5 ? 1 : -1,
                  cumulative: Array.from({ length: i + 1 }, () => Math.random() > 0.5 ? 1 : -1).reduce((a, b) => a + b, 0),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="trial" stroke="#9ca3af" fontSize={12} label={{ value: 'Trials', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9ca3af" fontSize={12} label={{ value: 'Cumulative Return', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                />
                <Line type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {quiz && (
          <motion.div variants={itemVariants}>
            <Card className={cn(showResult && (score >= quiz.passingScore ? 'border-green-500/30' : 'border-red-500/30'))}>
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-6 w-6 text-accent-400" />
                <h2 className="text-xl font-semibold text-gray-100">Knowledge Check</h2>
              </div>

              {!quizStarted ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4">
                    Test your understanding with {quiz.questions.length} questions
                  </p>
                  <Button onClick={handleStartQuiz} iconLeft={<BookOpen className="h-4 w-4" />}>
                    Start Quiz
                  </Button>
                </div>
              ) : showResult ? (
                <div className="text-center py-6 space-y-4">
                  <div className={cn(
                    'inline-flex items-center justify-center h-20 w-20 rounded-full',
                    score >= quiz.passingScore ? 'bg-green-500/20' : 'bg-red-500/20',
                  )}>
                    {score >= quiz.passingScore ? (
                      <Trophy className="h-10 w-10 text-green-400" />
                    ) : (
                      <X className="h-10 w-10 text-red-400" />
                    )}
                  </div>
                  <h3 className={cn(
                    'text-2xl font-bold',
                    score >= quiz.passingScore ? 'text-green-400' : 'text-red-400',
                  )}>
                    {score >= quiz.passingScore ? 'Passed!' : 'Not quite'}
                  </h3>
                  <p className="text-gray-400">
                    You scored {score}% — {score >= quiz.passingScore ? 'great job!' : 'keep practicing!'}
                  </p>
                  {attempt && (
                    <p className="text-xs text-gray-500">
                      Best score: {attempt.score}% | {attempt.isPassed ? 'Completed' : 'In progress'}
                    </p>
                  )}
                  <ProgressBar value={score} showPercentage variant={score >= quiz.passingScore ? 'success' : 'warning'} />
                  <Button
                    variant="secondary"
                    onClick={handleRetry}
                    iconLeft={<RotateCcw className="h-4 w-4" />}
                  >
                    Retry Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                    <ProgressBar
                      value={((currentQuestion + 1) / quiz.questions.length) * 100}
                      barClassName="bg-aero-500"
                      className="w-32"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <p className="text-lg font-medium text-gray-100">
                        {quiz.questions[currentQuestion].question}
                      </p>
                      <div className="space-y-2">
                        {quiz.questions[currentQuestion].options.map((option, optIndex) => (
                          <button
                            key={optIndex}
                            onClick={() => handleAnswer(optIndex)}
                            className={cn(
                              'w-full text-left rounded-lg border p-3 transition-all',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aero-500',
                              answers[currentQuestion] === optIndex
                                ? 'border-aero-500/50 bg-aero-500/10 text-aero-300'
                                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10',
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <span className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                                answers[currentQuestion] === optIndex
                                  ? 'bg-aero-500/20 text-aero-400'
                                  : 'bg-white/10 text-gray-400',
                              )}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              {option}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestion === 0}
                      iconLeft={<ArrowLeft className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-gray-500">
                      {answers.filter((a) => a >= 0).length} of {quiz.questions.length} answered
                    </span>
                    {currentQuestion < quiz.questions.length - 1 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextQuestion}
                        iconRight={<ArrowRight className="h-4 w-4" />}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSubmitQuiz}
                        loading={submitting}
                        disabled={answers.some((a) => a < 0)}
                        iconRight={<Check className="h-4 w-4" />}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            {prevLesson ? (
              <Link
                href={`/learn/${prevLesson.slug}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="text-sm font-medium">{prevLesson.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
          <div>
            {nextLesson ? (
              <Link
                href={`/learn/${nextLesson.slug}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors text-right"
              >
                <div>
                  <p className="text-xs text-gray-500">Next</p>
                  <p className="text-sm font-medium">{nextLesson.title}</p>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center py-4">
          <p className="text-xs text-gray-500">Practice points have no monetary value</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
