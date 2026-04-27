import { UserButton } from '@clerk/clerk-react';

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Elderly Care AI Dashboard</h1>
        <UserButton afterSignOutUrl="/login" />
      </div>
      <p>Welcome! Your dashboard will be built here.</p>
    </div>
  );
}