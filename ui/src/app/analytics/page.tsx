import { PortfolioAnalyticsDashboard } from '@/components/analytics/PortfolioAnalyticsDashboard';
import { Header } from '@/components/layout/Header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Analytics | SovaBTC',
  description: 'Comprehensive portfolio analytics with cross-network asset visualization, historical performance tracking, and risk metrics for SovaBTC Protocol.',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sova-black-900 via-sova-black-800 to-sova-black-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <PortfolioAnalyticsDashboard />
      </div>
    </div>
  );
} 