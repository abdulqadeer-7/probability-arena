'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get, post } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Mail, MessageSquare, ChevronDown, ChevronUp,
  Send, Clock, CheckCircle2, AlertCircle,
  HelpCircle, LifeBuoy, Plus,
} from 'lucide-react';
import type { SupportTicket } from '@/types';

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

const priorityColors: Record<string, 'info' | 'warning' | 'danger' | 'default'> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger',
};

const statusColors: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

const faqs = [
  {
    question: 'How do deposits and withdrawals work?',
    answer: 'Deposits are processed instantly using our secure payment system. Withdrawals are processed within 24 hours. Minimum withdrawal amount varies by payment method.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept major credit/debit cards, cryptocurrencies (BTC, ETH, USDT), and select e-wallets. All transactions are encrypted and securely processed.',
  },
  {
    question: 'How is fairness ensured?',
    answer: 'AeroArcade uses a provably fair system based on HMAC-SHA256 cryptography. Every game outcome can be independently verified using the server seed, client seed, and nonce. Visit our Fairness page to learn more.',
  },
  {
    question: 'I forgot my password. What should I do?',
    answer: 'Use the "Forgot Password" link on the login page to reset your password. You will receive an email with instructions to create a new password.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'You can request account deletion through the Settings page or by contacting our support team. Your personal data will be removed within 30 days of account deletion.',
  },
  {
    question: 'Is there a mobile app?',
    answer: 'AeroArcade is a web-based platform optimized for both desktop and mobile browsers. There is no native mobile app required.',
  },
];

export default function ContactPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await get<SupportTicket[]>('/support/tickets');
        setTickets(data);
      } catch (err: unknown) {
        setTicketsError(err instanceof Error ? err.message : 'Failed to load tickets');
      } finally {
        setTicketsLoading(false);
      }
    };
    fetchTickets();
  }, [submitSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await post('/support/tickets', { subject, message, priority });
      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      setPriority('medium');
      setShowForm(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-4xl space-y-8"
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <LifeBuoy className="h-8 w-8 text-aero-400" />
            <h1 className="text-3xl font-bold text-gray-100">Contact & Support</h1>
          </div>
          <p className="text-gray-400">We are here to help. Reach out to us or browse our FAQ.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <Clock className="h-5 w-5 text-aero-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-200">Response Time</p>
            <p className="text-xs text-gray-400">Within 24 hours</p>
          </Card>
          <Card className="text-center p-4">
            <Mail className="h-5 w-5 text-accent-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-200">Email</p>
            <p className="text-xs text-gray-400">support@aeroarcade.com</p>
          </Card>
          <Card className="text-center p-4">
            <MessageSquare className="h-5 w-5 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-200">Live Chat</p>
            <p className="text-xs text-gray-400">Available 9 AM - 5 PM EST</p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">Submit a Ticket</h2>
              <Button
                variant={showForm ? 'ghost' : 'primary'}
                size="sm"
                onClick={() => setShowForm(!showForm)}
                iconLeft={showForm ? undefined : <Plus className="h-4 w-4" />}
              >
                {showForm ? 'Cancel' : 'New Ticket'}
              </Button>
            </div>
            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <Input
                    label="Subject"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="block w-full rounded-lg px-3 py-2.5 text-sm text-gray-100 bg-white/5 backdrop-blur-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-aero-500/20 focus:border-aero-500/50 transition-all duration-200 resize-y"
                      placeholder="Describe your issue in detail"
                      required
                    />
                  </div>
                  <Select
                    label="Priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                  {submitError && (
                    <p className="text-sm text-red-400" role="alert">{submitError}</p>
                  )}
                  {submitSuccess && (
                    <p className="text-sm text-green-400">Ticket submitted successfully</p>
                  )}
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={!subject.trim() || !message.trim()}
                    iconLeft={<Send className="h-4 w-4" />}
                  >
                    Submit Ticket
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Your Tickets</h2>
            {ticketsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : ticketsError ? (
              <ErrorState title="Failed to load tickets" description={ticketsError} />
            ) : tickets.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No tickets yet"
                description="Your submitted tickets will appear here"
              />
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-4 transition-colors hover:bg-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-200 truncate">{ticket.subject}</p>
                        <Badge variant={statusColors[ticket.status] || 'default'} size="sm">
                          {ticket.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant={priorityColors[ticket.priority] || 'default'} size="sm">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aero-500"
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-sm font-medium text-gray-200 pr-4">{faq.question}</span>
                    {openFaq === i ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
