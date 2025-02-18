import { TriggerRankingUpdate } from '@/components/trigger-ranking-update';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <TriggerRankingUpdate />
      </div>
      {/* Rest of your dashboard content */}
    </div>
  );
} 