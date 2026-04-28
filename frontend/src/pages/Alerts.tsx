import { useAlerts, useAcknowledgeAlert } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const acknowledge = useAcknowledgeAlert();

  if (isLoading) return <p className="p-6">Loading alerts...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">🚨 Alerts</h1>
      {alerts && alerts.length === 0 ? (
        <p className="text-muted-foreground">No active alerts. Everything looks good.</p>
      ) : (
        <div className="space-y-3">
          {alerts?.map(alert => (
            <Card key={alert.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {alert.resident?.name || 'Unknown Resident'}
                </CardTitle>
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {alert.severity}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {alert.metadata?.message || alert.type}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledge.mutate(alert.id)}
                    disabled={acknowledge.isPending}
                  >
                    Acknowledge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}