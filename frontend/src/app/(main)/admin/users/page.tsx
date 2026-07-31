'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { get, patch, del } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import type { User } from '@/types';

type SortField = 'displayName' | 'email' | 'role' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await get<{ users: User[]; pagination: { page: number; totalPages: number; total: number } }>(
        '/admin/users',
        { page, limit: 20, search: search || undefined, sortField, sortDir }
      );
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortField, sortDir, user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    setActionLoading(userId);
    try {
      await patch(`/admin/users/${userId}`, { isActive: !suspend });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !suspend } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, isActive: !suspend } : null);
      }
    } catch {
      // handle silently — could add toast
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(userId);
    try {
      await del(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch {
      // handle silently
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    setActionLoading(userId);
    try {
      await patch(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, role: newRole } : null);
      }
    } catch {
      // handle silently
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-gray-400">{total} total users</p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="glass w-full rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aero-500/50"
              aria-label="Search users"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* User List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage all platform users</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-4 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('displayName')}
                  className="flex items-center gap-1 text-left hover:text-gray-200 transition-colors"
                >
                  Name <ArrowUpDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-1 text-left hover:text-gray-200 transition-colors"
                >
                  Email <ArrowUpDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleSort('role')}
                  className="flex items-center gap-1 text-left hover:text-gray-200 transition-colors"
                >
                  Role <ArrowUpDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 text-left hover:text-gray-200 transition-colors"
                >
                  Joined <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={fetchUsers}>
                    Retry
                  </Button>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No users found</div>
              ) : (
                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={cn(
                        'w-full grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 rounded-lg p-3 text-left transition-colors',
                        selectedUser?.id === u.id
                          ? 'bg-aero-500/10 border border-aero-500/20'
                          : 'hover:bg-gray-800/50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aero-500/20 text-xs font-medium text-aero-400">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-sm font-medium text-gray-200">{u.displayName}</span>
                      </div>
                      <span className="truncate text-sm text-gray-400 sm:flex items-center hidden">{u.email}</span>
                      <div className="flex items-center">
                        <Badge variant={u.role === 'admin' ? 'info' : u.role === 'moderator' ? 'warning' : 'default'}>
                          {u.role}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-400 sm:flex items-center hidden">{formatDate(u.createdAt)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
                <p className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* User Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>
                  {selectedUser ? 'Manage selected user' : 'Select a user from the list'}
                </CardDescription>
              </CardHeader>

              <AnimatePresence mode="wait">
                {selectedUser ? (
                  <motion.div
                    key={selectedUser.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aero-500/20 text-lg font-bold text-aero-400">
                        {selectedUser.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{selectedUser.displayName}</p>
                        <p className="text-sm text-gray-400">{selectedUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between rounded-lg bg-gray-800/50 px-4 py-2.5">
                        <span className="text-sm text-gray-400">Status</span>
                        <Badge variant={selectedUser.isActive ? 'success' : 'danger'}>
                          {selectedUser.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </div>
                      <div className="flex justify-between rounded-lg bg-gray-800/50 px-4 py-2.5">
                        <span className="text-sm text-gray-400">Verified</span>
                        {selectedUser.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex justify-between rounded-lg bg-gray-800/50 px-4 py-2.5">
                        <span className="text-sm text-gray-400">Role</span>
                        <select
                          value={selectedUser.role}
                          onChange={(e) =>
                            handleRoleChange(selectedUser.id, e.target.value as User['role'])
                          }
                          disabled={actionLoading === selectedUser.id}
                          className="rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-aero-500/50"
                          aria-label="Change user role"
                        >
                          <option value="player">Player</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex justify-between rounded-lg bg-gray-800/50 px-4 py-2.5">
                        <span className="text-sm text-gray-400">Joined</span>
                        <span className="text-sm text-gray-200">
                          {formatDate(selectedUser.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        variant={selectedUser.isActive ? 'danger' : 'primary'}
                        className="w-full"
                        size="sm"
                        loading={actionLoading === selectedUser.id}
                        onClick={() => handleSuspend(selectedUser.id, selectedUser.isActive)}
                      >
                        {selectedUser.isActive ? (
                          <>
                            <Ban className="h-4 w-4" /> Suspend User
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" /> Unsuspend User
                          </>
                        )}
                      </Button>

                      {selectedUser.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          className="w-full text-red-400 hover:text-red-300"
                          size="sm"
                          loading={actionLoading === selectedUser.id}
                          onClick={() => handleDelete(selectedUser.id)}
                        >
                          <ShieldOff className="h-4 w-4" /> Delete User
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-8 text-center"
                  >
                    <Shield className="h-12 w-12 text-gray-600" />
                    <p className="text-sm text-gray-400">
                      Click on a user to view their details and manage their account
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
