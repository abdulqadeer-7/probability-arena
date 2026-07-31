'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { get, patch } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import {
  Gamepad2, Settings, Power, PowerOff,
  BarChart3, Edit3, Save, X, Activity,
  TrendingUp, Users,
} from 'lucide-react';
import type { Game } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface GameStats {
  totalRounds: number;
  totalPlayers: number;
  averageBet: number;
  winRate: number;
  houseEdge: number;
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editForm, setEditForm] = useState({ minBet: 0, maxBet: 0 });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await get<Game[]>('/admin/games');
        setGames(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleToggleActive = async (game: Game) => {
    setTogglingId(game.id);
    try {
      const updated = await patch<Game>(`/admin/games/${game.id}`, {
        isActive: !game.isActive,
      });
      setGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)));
      toast.success(`${game.name} ${updated.isActive ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update game');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setEditForm({ minBet: game.minBet, maxBet: game.maxBet });
  };

  const handleSaveEdit = async () => {
    if (!editingGame) return;
    setSaving(true);
    try {
      const updated = await patch<Game>(`/admin/games/${editingGame.id}`, {
        minBet: editForm.minBet,
        maxBet: editForm.maxBet,
      });
      setGames((prev) => prev.map((g) => (g.id === editingGame.id ? updated : g)));
      toast.success('Game configuration updated');
      setEditingGame(null);
    } catch {
      toast.error('Failed to update game');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <AdminGamesSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load games" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="h-8 w-8 text-aero-400" />
            <h1 className="text-3xl font-bold text-gray-100">Game Management</h1>
          </div>
          <p className="text-gray-400">Manage games, configure settings, and view statistics</p>
        </motion.div>

        {games.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState icon={Gamepad2} title="No games configured" description="Games will appear here once configured" />
          </motion.div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <motion.div key={game.id} variants={itemVariants}>
                <Card>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'rounded-xl p-3',
                        game.isActive ? 'bg-green-500/10' : 'bg-gray-500/10',
                      )}>
                        <Activity className={cn('h-6 w-6', game.isActive ? 'text-green-400' : 'text-gray-500')} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-100">{game.name}</h3>
                          <Badge variant={game.isActive ? 'success' : 'default'} size="sm" dot>
                            {game.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{game.shortDescription}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Min: {formatCurrency(game.minBet)}</span>
                          <span>Max: {formatCurrency(game.maxBet)}</span>
                          <span>Category: {game.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(game)}
                        iconLeft={<Settings className="h-4 w-4" />}
                      >
                        Config
                      </Button>
                      <Button
                        variant={game.isActive ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(game)}
                        loading={togglingId === game.id}
                        iconLeft={game.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      >
                        {game.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value</p>
        </motion.div>
      </motion.div>

      <Modal
        isOpen={!!editingGame}
        onClose={() => setEditingGame(null)}
        title={`Configure: ${editingGame?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Minimum Bet"
            type="number"
            value={editForm.minBet}
            onChange={(e) => setEditForm((prev) => ({ ...prev, minBet: Number(e.target.value) }))}
            min={1}
          />
          <Input
            label="Maximum Bet"
            type="number"
            value={editForm.maxBet}
            onChange={(e) => setEditForm((prev) => ({ ...prev, maxBet: Number(e.target.value) }))}
            min={editForm.minBet}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={saving} iconLeft={<Save className="h-4 w-4" />}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AdminGamesSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
