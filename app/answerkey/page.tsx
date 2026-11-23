export const runtime = 'edge';

import type { Metadata } from 'next';
import AnswerkeyCalculator from '../components/AnswerkeyCalculator';
import ExamFaqSection from '../components/ExamFaqSection';
import AnswerkeySidebar from '../components/AnswerkeySidebar';
import { fetchBlogsFromCloudflareD1, FALLBACK_BLOG_POSTS, BlogPost } from '../data/blogs';

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: {
    absolute: `CBTRank AnswerKey Calculator – Rank & Score Calculator ${currentYear}`,
  },
  description: `Calculate your exam marks, shift rank, and category cut off instantly with CBTRank's Answer Key Calculator ${currentYear}. Works with all DigiALM and TCS iON response sheets.`,
  keywords: [
    'Answer Key Calculator',
    'CBT marks calculator',
    'DigiALM answer key score',
    'SSC answer key calculator',
    'RRB answer key calculator',
    'rank predictor',
    'TCS iON response sheet score',
    'CBT response sheet score calculator'
  ],
  alternates: {
    canonical: 'https://cbtrank.com/answerkey',
  },
  openGraph: {
    title: `CBTRank AnswerKey Calculator – Rank & Score Calculator ${currentYear}`,
    description: 'Calculate your marks, shift rank, and category rank instantly. Supports all major CBT exams.',
    url: 'https://cbtrank.com/answerkey',
    siteName: 'CBT RANK',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `CBTRank AnswerKey Calculator – Rank & Score Calculator ${currentYear}`,
    description: 'Calculate your marks, shift rank, and category rank instantly.',
  },
};

const UNIVERSAL_FAQS = [
  {
    q: 'How does the Universal Answer Key Calculator work?',
    a: 'Simply paste your official response sheet URL (DigiALM / TCS iON) into the calculator input. Our system parses each question, matches your marked response with official answer keys, and calculates your total positive marks, negative marks, and net score.'
  },
  {
    q: 'Which exam links can be checked here?',
    a: 'You can check answer keys from SSC (CGL, CHSL, MTS, GD, JE, CPO), Railway RRB (NTPC, Group D, ALP, Technician), State PSCs, Subordinate Services Selection Boards, and any Central or State government recruitment exams hosted on TCS iON or DigiALM platforms.'
  },
  {
    q: 'How do I copy my response sheet link on mobile?',
    a: 'Open your candidate login page in Chrome or your mobile browser where your response sheet is displayed. Tap the browser top address bar and click the Copy icon to get the complete URL, then paste it directly into the calculator.'
  },
  {
    q: 'Are my scores and personal details saved publicly?',
    a: 'No. Your marks are processed securely. CBT RANK never asks for or stores candidate passwords, roll numbers, or personal sensitive data.'
  }
];

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  'name': `CBTRank AnswerKey Calculator – Rank & Score Calculator ${currentYear}`,
  'url': 'https://cbtrank.com/answerkey',
  'applicationCategory': 'EducationalApplication',
  'operatingSystem': 'All',
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'INR'
  },
  'featureList': [
    'Automated response sheet parsing',
    'Shift rank calculation',
    'Category rank estimation',
    'Section-wise score breakdown',
    'Instant cut off analysis'
  ]
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': UNIVERSAL_FAQS.map((faq) => ({
    '@type': 'Question',
    'name': faq.q,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.a,
    },
  })),
};

export default async function AnswerkeyPage() {
  let allPosts: BlogPost[] = [];
  try {
    allPosts = await fetchBlogsFromCloudflareD1();
  } catch (e) {
    allPosts = FALLBACK_BLOG_POSTS;
  }
  if (!Array.isArray(allPosts) || allPosts.length === 0) {
    allPosts = FALLBACK_BLOG_POSTS;
  }

  const recentPosts = allPosts.slice(0, 5);
  const popularPosts = [...allPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <AnswerkeyCalculator
        initialTitle={`CBTRank AnswerKey Calculator ${currentYear}`}
        sidebar={
          <AnswerkeySidebar
            currentSlug=""
            recentPosts={recentPosts}
            popularPosts={popularPosts}
          />
        }
      >
        <ExamFaqSection
          formattedTitle="Universal CBT Answer Key Calculator"
          faqs={UNIVERSAL_FAQS}
          style={{ width: '100%', maxWidth: '100%', margin: '24px 0 0', padding: 0 }}
        />
      </AnswerkeyCalculator>
    </>
  );
}
