import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Exam Typing Speed Test Online (SSC, RRB, High Court) | CBT RANK',
  description: 'Practice exam-mode typing test for SSC CGL, CHSL, RRB NTPC, High Court, and State exams with live countdown timer, backspace restriction lock, instant WPM, and net accuracy calculations.',
  keywords: [
    'Typing Test Online',
    'SSC Typing Test',
    'SSC CGL Typing Test',
    'SSC CHSL Typing Test',
    'RRB NTPC Typing Test',
    'High Court Typing Test',
    'Typing Speed Test 35 WPM',
    'Typing Practice with Backspace Restriction',
    'CBT Rank Typing Test'
  ],
  alternates: {
    canonical: 'https://cbtrank.com/typing',
  },
  openGraph: {
    title: 'Free Exam Typing Speed Test Online | CBT RANK',
    description: 'Exam-mode typing test with live timer, backspace lock, net speed & error calculation for SSC & Railway exams.',
    url: 'https://cbtrank.com/typing',
    siteName: 'CBT RANK',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Free Exam Typing Speed Test Online | CBT RANK',
    description: 'Exam-mode typing test for SSC CGL, CHSL, RRB NTPC & State Exams.',
  },
};

export default function TypingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
