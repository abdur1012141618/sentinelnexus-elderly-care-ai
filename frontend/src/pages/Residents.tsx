import { useResidents } from '@/hooks/useResidents';
import AddResidentDialog from '@/components/AddResidentDialog';

export default function Residents() {
  const { data: residents, isLoading, error } = useResidents();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Residents</h1>
        <AddResidentDialog />
      </div>
      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">Error loading residents.</p>}
      {residents && residents.length === 0 && <p className="text-gray-500">No residents found.</p>}
      {residents && residents.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {residents.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{r.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{r.room || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{r.age ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{r.gait || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}