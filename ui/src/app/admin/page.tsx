import { CustodianDashboard } from '@/components/admin/CustodianDashboard';
import { Header } from '@/components/layout/Header';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sova-black-900 via-sova-black-800 to-sova-black-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <CustodianDashboard />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Admin Panel - SovaBTC Protocol',
  description: 'Administrative interface for custodian operations and protocol management',
}; 