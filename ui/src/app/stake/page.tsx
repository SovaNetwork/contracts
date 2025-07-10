import { StakingInterface } from '@/components/staking/StakingInterface';

export default function StakePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <StakingInterface />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Stake - SovaBTC',
  description: 'Stake sovaBTC and earn SOVA rewards with flexible lock periods and yield optimization',
}; 