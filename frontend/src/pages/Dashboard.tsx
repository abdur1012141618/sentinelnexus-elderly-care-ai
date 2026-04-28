import { Link } from 'react-router-dom';
import { useResidents } from '@/hooks/useResidents';
import { useAlerts } from '@/hooks/useAlerts';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: residents, isLoading: loadingResidents } = useResidents();
  const { data: alerts } = useAlerts();

  const openAlertsCount = alerts?.filter(a => a.isOpen).length ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      {/* Residents Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('dashboard.residents')}</h2>
          <Link to="/residents" className="text-sm text-blue-600 hover:underline">{t('dashboard.viewAll')}</Link>
        </div>
        {loadingResidents && <p className="text-gray-500">{t('dashboard.loading')}</p>}
        {residents && residents.length === 0 && (
          <p className="text-gray-500">{t('dashboard.noResidents')}</p>
        )}
        {residents && residents.length > 0 && (
          <ul className="space-y-2">
            {residents.slice(0, 5).map((r) => (
              <li key={r.id} className="p-2 border rounded">
                <span className="font-medium">{r.name}</span>
                {r.room && <span className="text-gray-500 ml-2">{t('dashboard.room')}: {r.room}</span>}
                {r.age && <span className="text-gray-500 ml-2">{t('dashboard.age')}: {r.age}</span>}
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
          <h3 className="text-lg font-medium">💓 {t('dashboard.vitalsCard')}</h3>
        </Link>
        <Link to="/alerts" className="p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition">
          <h3 className="text-lg font-medium">🚨 {t('dashboard.alertsCard')} ({openAlertsCount})</h3>
        </Link>
        <Link to="/fall-check" className="p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition">
          <h3 className="text-lg font-medium">🧠 {t('dashboard.fallCheckCard')}</h3>
        </Link>
      </div>
    </div>
  );
}