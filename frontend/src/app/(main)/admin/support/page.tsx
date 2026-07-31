'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { get, patch } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import {
  MessageSquare, Filter, ChevronRight, Send,
  CheckCircle2, Clock, AlertCircle, Inbox,
} from 'lucide-react';
import type { SupportTicket } from '@/types';

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

const statusConfig: Record<string, { label: string; variant: 'info' | 'success' | 'default' | 'warning'; icon: typeof Clock }> = {
  open: { label: 'Open', variant: 'info', icon: AlertCircle },
  in_progress: { label: 'In Progress', variant: 'warning', icon: Clock },
  resolved: { label: 'Resolved', variant: 'success', icon: CheckCircle2 },
  closed: { label: 'Closed', variant: 'default', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' | 'default' }> = {
  low: { label: 'Low', variant: 'info' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'danger' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await get<SupportTicket[]>('/admin/support/tickets');
        setTickets(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load tickets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const updated = await patch<SupportTicket>(`/admin/support/tickets/${ticketId}`, { status: newStatus });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updated);
      }
      toast.success(`Ticket ${newStatus.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setSending(true);
    try {
      await patch(`/admin/support/tickets/${selectedTicket.id}/respond`, { message: responseText });
      toast.success('Response sent');
      setResponseText('');
    } catch {
      toast.error('Failed to send response');
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return <AdminSupportSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load tickets" description={error} onRetry={() => window.location.reload()} />
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
            <MessageSquare className="h-8 w-8 text-aero-400" />
            <h1 className="text-3xl font-bold text-gray-100">Support Tickets</h1>
          </div>
          <p className="text-gray-400">Manage user support tickets and responses</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            srLabel
            className="sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            label="Priority"
            srLabel
            className="sm:w-40"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </motion.div>

        {filteredTickets.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={Inbox}
              title="No tickets found"
              description={statusFilter !== 'all' || priorityFilter !== 'all' ? 'Try changing filters' : 'No support tickets yet'}
            />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const sConfig = statusConfig[ticket.status] || statusConfig.open;
              const StatusIcon = sConfig.icon;
              const pConfig = priorityConfig[ticket.priority] || priorityConfig.medium;

              return (
                <motion.div key={ticket.id} variants={itemVariants}>
                  <Card
                    variant="interactive"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn('rounded-xl p-2.5', sConfig.variant === 'info' ? 'bg-aero-500/10' : sConfig.variant === 'warning' ? 'bg-accent-500/10' : sConfig.variant === 'success' ? 'bg-green-500/10' : 'bg-white/5')}>
                        <StatusIcon className={cn('h-5 w-5', sConfig.variant === 'info' ? 'text-aero-400' : sConfig.variant === 'warning' ? 'text-accent-400' : sConfig.variant === 'success' ? 'text-green-400' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-100 truncate">{ticket.subject}</p>
                          <Badge variant={sConfig.variant} size="sm">{sConfig.label}</Badge>
                          <Badge variant={pConfig.variant} size="sm">{pConfig.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{ticket.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(ticket.createdAt)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500 shrink-0" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value</p>
        </motion.div>
      </motion.div>

      <Modal
        isOpen={!!selectedTicket}
        onClose={() => { setSelectedTicket(null); setResponseText(''); }}
        title={selectedTicket?.subject || 'Ticket Detail'}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusConfig[selectedTicket.status]?.variant || 'default'}>
                {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
              </Badge>
              <Badge variant={priorityConfig[selectedTicket.priority]?.variant || 'default'}>
                {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
              </Badge>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-gray-400 mb-1">Message</p>
              <p className="text-sm text-gray-200">{selectedTicket.message}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Created {formatDate(selectedTicket.createdAt)}
              {selectedTicket.updatedAt !== selectedTicket.createdAt && (
                <span>Updated {formatDate(selectedTicket.updatedAt)}</span>
              )}
            </div>

            <div className="flex gap-2">
              {selectedTicket.status === 'open' && (
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => handleStatusChange(selectedTicket.id, 'in_progress')}
                  iconLeft={<Clock className="h-4 w-4" />}
                >
                  Start Progress
                </Button>
              )}
              {selectedTicket.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                  iconLeft={<CheckCircle2 className="h-4 w-4" />}
                >
                  Resolve
                </Button>
              )}
              {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                >
                  Close
                </Button>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Respond</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="block w-full rounded-lg px-3 py-2.5 text-sm text-gray-100 bg-white/5 backdrop-blur-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-aero-500/20 focus:border-aero-500/50 transition-all duration-200 resize-y"
                placeholder="Type your response..."
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleRespond}
                  loading={sending}
                  disabled={!responseText.trim()}
                  iconLeft={<Send className="h-4 w-4" />}
                >
                  Send Response
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AdminSupportSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
