import { RedemptionMonitoringHub } from '@/components/redeem/RedemptionMonitoringHub';

export default function RedemptionQueuePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <RedemptionMonitoringHub />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Redemption Queue - SovaBTC',
  description: 'Advanced redemption queue monitoring with real-time position tracking, completion estimates, and batch management',
}; 