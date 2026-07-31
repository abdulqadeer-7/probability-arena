'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Shield, Database, Eye, Trash2, Download,
  Cookie, WifiOff, Mail, CheckCircle2,
} from 'lucide-react';

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

export default function PrivacyPage() {
  const lastUpdated = 'January 1, 2025';

  const sections = [
    {
      icon: Database,
      title: 'What Data We Collect',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">We follow a minimal data collection policy. We only collect:</p>
          <ul className="space-y-2">
            {[
              { label: 'Email Address', desc: 'Used for account verification and essential communications' },
              { label: 'Display Name', desc: 'Your chosen public username shown on the leaderboard' },
              { label: 'Game Activity', desc: 'Game results, scores, and achievements for platform functionality' },
              { label: 'Account Settings', desc: 'Preferences such as theme, language, and notification settings' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-aero-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-200">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: Eye,
      title: 'How We Use Your Data',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">Your data is used exclusively for:</p>
          <ul className="space-y-2">
            {[
              'Providing and maintaining your account and game services',
              'Displaying leaderboards and achievements',
              'Sending essential service notifications',
              'Improving platform functionality and user experience',
              'Complying with legal obligations',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            We do not use your data for marketing, advertising, or any purpose beyond providing our services.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Data Retention Policy',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            We retain your data for as long as your account is active. If you delete your account, we will remove your
            personal data within 30 days. Anonymized game statistics may be retained for analytical purposes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-gray-400">Active Accounts</p>
              <p className="text-sm font-medium text-gray-200">Data retained</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-gray-400">Deleted Accounts</p>
              <p className="text-sm font-medium text-gray-200">30 day cleanup</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-gray-400">Anonymized Data</p>
              <p className="text-sm font-medium text-gray-200">May be retained</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Eye,
      title: 'Your Rights',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">You have the following rights regarding your personal data:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-aero-500/5 border border-aero-500/20 p-4">
              <Eye className="h-5 w-5 text-aero-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-200 mb-1">Right to Access</h3>
              <p className="text-xs text-gray-400">Request a copy of your personal data at any time</p>
            </div>
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
              <Trash2 className="h-5 w-5 text-red-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-200 mb-1">Right to Deletion</h3>
              <p className="text-xs text-gray-400">Request permanent deletion of your account and data</p>
            </div>
            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4">
              <Download className="h-5 w-5 text-green-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-200 mb-1">Right to Export</h3>
              <p className="text-xs text-gray-400">Download your data in a portable format</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Cookie,
      title: 'Cookie Policy',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            We use only essential cookies required for authentication and platform functionality. We do not use tracking
            cookies, advertising cookies, or third-party analytics cookies.
          </p>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Essential Cookies</p>
                <p className="text-xs text-gray-400">Authentication, session management, preferences</p>
              </div>
              <Badge variant="info" size="sm">Always Active</Badge>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            You can control cookie settings through your browser preferences. However, disabling essential cookies may
            prevent you from using our services.
          </p>
        </div>
      ),
    },
    {
      icon: WifiOff,
      title: 'Third-Party Services',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            AeroArcade does not use any third-party analytics, advertising, or tracking services. We do not share your
            data with any third parties except as required by law. The platform operates independently without relying
            on external data processors.
          </p>
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4 text-center">
            <p className="text-sm font-medium text-green-400">No third-party services used</p>
          </div>
        </div>
      ),
    },
    {
      icon: Mail,
      title: 'Contact for Privacy Concerns',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            If you have any questions about this privacy policy or wish to exercise your data rights, please contact us:
          </p>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-gray-200">Email: privacy@aeroarcade.com</p>
            <p className="text-sm text-gray-400">Response time: Within 48 hours</p>
          </div>
        </div>
      ),
    },
  ];

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
            <Shield className="h-8 w-8 text-aero-400" />
            <h1 className="text-3xl font-bold text-gray-100">Privacy Policy</h1>
          </div>
          <p className="text-gray-400">
            Last updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Your privacy is important to us. This policy explains what data we collect and how we handle it.
          </p>
        </motion.div>

        {sections.map((section, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card>
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-aero-500/10 p-3 shrink-0">
                  <section.icon className="h-6 w-6 text-aero-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-100 mb-3">{section.title}</h2>
                  {section.content}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
