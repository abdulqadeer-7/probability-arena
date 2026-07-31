'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  FileText, Scale, AlertTriangle, Ban,
  BookOpen, Shield, Mail, CheckCircle2,
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

export default function TermsPage() {
  const lastUpdated = 'January 1, 2025';

  const sections = [
    {
      icon: BookOpen,
      title: 'Account Terms',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            By creating an account on AeroArcade, you agree to the following terms:
          </p>
          <ul className="space-y-2">
            {[
              'You must be at least 18 years of age to use this platform',
              'You are responsible for maintaining the confidentiality of your account credentials',
              'You must provide accurate and complete registration information',
              'You may not create multiple accounts',
              'You may not share your account with others',
              'We reserve the right to suspend or terminate accounts that violate these terms',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-aero-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: Ban,
      title: 'Acceptable Use',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">You agree not to use the platform for any of the following prohibited activities:</p>
          <ul className="space-y-2">
            {[
              'Exploiting bugs, glitches, or vulnerabilities for unfair advantage',
              'Using automated scripts, bots, or third-party tools to interact with the platform',
              'Engaging in any form of fraud, deception, or manipulation',
              'Harassing, threatening, or abusing other users',
              'Attempting to reverse-engineer, decompile, or tamper with the platform',
              'Using the platform for any illegal purpose or in violation of any applicable laws',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: Scale,
      title: 'Practice Points Rules',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="font-semibold text-red-300">Important Notice</h3>
            </div>
            <p className="text-sm text-gray-300 font-medium">
              Practice points have no monetary value. They cannot be purchased, sold, exchanged, transferred, or
              withdrawn for real money or anything of value.
            </p>
          </div>
          <ul className="space-y-2">
            {[
              'No Monetary Value — Practice points are virtual items with no real-world value',
              'No Purchase — Practice points cannot be bought with real money or any form of currency',
              'No Withdrawal — Practice points cannot be redeemed, cashed out, or converted to real money',
              'No Transfer — Practice points cannot be transferred, traded, or gifted to other users',
              'No Exchange — Practice points are not exchangeable for any real or virtual goods',
              'We reserve the right to adjust, modify, or reset practice point balances as needed',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Ban className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Intellectual Property',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            All content on AeroArcade, including but not limited to code, design, graphics, text, and game mechanics,
            is the intellectual property of AeroArcade and is protected by applicable copyright and trademark laws.
          </p>
          <ul className="space-y-2">
            {[
              'You may not copy, modify, distribute, or create derivative works without permission',
              'The platform is licensed for personal, non-commercial use only',
              'All trademarks and brand elements remain the property of their respective owners',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-aero-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: AlertTriangle,
      title: 'Limitation of Liability',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            AeroArcade provides the platform on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent
            permitted by law:
          </p>
          <ul className="space-y-2">
            {[
              'We make no warranties regarding the availability, accuracy, or reliability of the platform',
              'We are not liable for any indirect, incidental, or consequential damages',
              'We are not responsible for any loss of data, practice points, or account access',
              'Our total liability is limited to the maximum extent permitted by applicable law',
              'We do not guarantee that the platform will be uninterrupted or error-free',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: Scale,
      title: 'Governing Law',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
            AeroArcade operates, without regard to its conflict of law provisions. Any disputes arising from these
            terms shall be resolved through binding arbitration.
          </p>
        </div>
      ),
    },
    {
      icon: Mail,
      title: 'Contact Information',
      content: (
        <div className="space-y-3">
          <p className="text-gray-400">
            If you have any questions about these terms, please contact us:
          </p>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-sm text-gray-200">Email: support@aeroarcade.com</p>
            <p className="text-sm text-gray-400">Response time: Within 24 hours</p>
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
            <FileText className="h-8 w-8 text-aero-400" />
            <h1 className="text-3xl font-bold text-gray-100">Terms of Use</h1>
          </div>
          <p className="text-gray-400">
            Last updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please read these terms carefully before using the AeroArcade platform
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

        <motion.div variants={itemVariants}>
          <Card className="border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="font-medium text-red-300 mb-1">Summary</p>
                <p>
                  This is a real-money gaming platform. By using AeroArcade, you confirm that you are
                  18 years or older and understand the financial risks involved. Play responsibly.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Play responsibly. Must be 18+.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
