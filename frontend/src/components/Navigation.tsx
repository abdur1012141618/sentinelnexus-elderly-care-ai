import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/hooks/useAlerts';

export default function Navigation() {
  const { data: alerts } = useAlerts();
  const openCount = alerts?.filter(a => a.isOpen).length ?? 0;

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="font-bold text-lg text-primary">Elderly Care AI</Link>
        <Link to="/residents"><Button variant="ghost" size="sm">Residents</Button></Link>
        <Link to="/vitals"><Button variant="ghost" size="sm">Vitals</Button></Link>
        <Link to="/fall-check"><Button variant="ghost" size="sm">Fall Check</Button></Link>
        <Link to="/health-timeline"><Button variant="ghost" size="sm">🧬 Digital Twin</Button></Link>
        <Link to="/alerts">
          <Button variant={openCount > 0 ? 'destructive' : 'ghost'} size="sm">
            🚨 {openCount}
          </Button>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <UserButton afterSignOutUrl="/login" />
      </div>
    </nav>
  );
}