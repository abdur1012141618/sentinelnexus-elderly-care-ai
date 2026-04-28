import { UserButton } from '@clerk/clerk-react';
import { useResidents } from '@/hooks/useResidents';
import { useAlerts } from '@/hooks/useAlerts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: residents, isLoading: loadingResidents } = useResidents();
  const { data: alerts } = useAlerts();

  const openAlertsCount = alerts?.filter(a => a.isOpen).length ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Elderly Care AI Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link to="/alerts">
            <Button variant={openAlertsCount > 0 ? 'destructive' : 'outline'} size="sm">
              🚨 {openAlertsCount} Alert{openAlertsCount !== 1 ? 's' : ''}
            </Button>
          </Link>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </div>

      {/* Residents Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Residents</h2>
          <Link to="/residents" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        {loadingResidents && <p className="text-gray-500">Loading residents...</p>}
        {residents && residents.length === 0 && (
          <p className="text-gray-500">No residents yet.</p>
        )}
        {residents && residents.length > 0 && (
          <ul className="space-y-2">
            {residents.slice(0, 5).map((r) => (
              <li key={r.id} className="p-2 border rounded">
                <span className="font-medium">{r.name}</span>
                {r.room && <span className="text-gray-500 ml-2">Room: {r.room}</span>}
                {r.age && <span className="text-gray-500 ml-2">Age: {r.age}</span>}
              </li>
            ))}
            {residents.length > 5 && (
              <li className="text-sm text-gray-500 italic">...and {residents.length - 5} more</li>
            )}
          </ul>
        )}
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/vitals" className="p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition">
          <h3 className="text-lg font-medium">💓 Vitals</h3>
          <p className="text-sm text-gray-500">Record & view vitals</p>
        </Link>
        <Link to="/alerts" className="p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition">
          <h3 className="text-lg font-medium">🚨 Alerts</h3>
          <p className="text-sm text-gray-500">Active warnings & alerts</p>
        </Link>
        <Link to="/fall-check" className="p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition">
          <h3 className="text-lg font-medium">🧠 Fall Check</h3>
          <p className="text-sm text-gray-500">Predict fall risk</p>
        </Link>
      </div>
    </div>
  );
}