import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResidents } from '@/hooks/useResidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';

interface FallCheckResult {
  id: string;
  age: number;
  confidence: number;
  gait: string;
  history: string | null;
  isFall: boolean;
  createdAt: string;
  residentName?: string;
  aiExplanation?: string;
}

export default function FallCheck() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: residents } = useResidents();
  const [residentId, setResidentId] = useState('');
  const [age, setAge] = useState('');
  const [gait, setGait] = useState('');
  const [history, setHistory] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<FallCheckResult | null>(null);
  const [pastChecks, setPastChecks] = useState<FallCheckResult[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const selectedResident = residents?.find(r => r.id === residentId);

  const handleResidentChange = async (value: string) => {
    setResidentId(value);
    setLastResult(null);
    setPastChecks([]);
    if (value) {
      try {
        const { data } = await apiClient.get(`/fall-checks/${value}`);
        setPastChecks(data);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentId || !age || !gait) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const endpoint = useAI ? '/ai-fall-check' : '/fall-checks';
      const { data } = await apiClient.post(endpoint, {
        residentId,
        age: parseInt(age),
        gait,
        history: history || null,
      });
      const enriched = { ...data, residentName: selectedResident?.name || 'Unknown' };
      setLastResult(enriched);
      setPastChecks(prev => [enriched, ...prev]);
      toast({ title: 'Success', description: `Check completed. Risk: ${(enriched.confidence * 100).toFixed(0)}%` });
    } catch (err: any) {
      console.error('Fall check failed', err);
      const message = err?.response?.data?.error || err.message || 'An error occurred';
      toast({ title: 'Check failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('fallcheck.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('fallcheck.runFallCheck')}</CardTitle>
          <CardDescription>{t('fallcheck.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <Label htmlFor="ai-switch" className="text-sm font-medium cursor-pointer">
                🧪 Use AI (Ollama) for prediction
              </Label>
              <Switch id="ai-switch" checked={useAI} onCheckedChange={setUseAI} />
            </div>
            <div>
              <Label>{t('fallcheck.resident')}</Label>
              <Select onValueChange={handleResidentChange} value={residentId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fallcheck.selectResident')} />
                </SelectTrigger>
                <SelectContent>
                  {residents?.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age">{t('fallcheck.age')}</Label>
              <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g., 78" />
            </div>
            <div>
              <Label htmlFor="gait">{t('fallcheck.gait')}</Label>
              <Select onValueChange={setGait} value={gait}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fallcheck.selectGait')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steady">Steady</SelectItem>
                  <SelectItem value="unsteady">Unsteady</SelectItem>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="shuffling">Shuffling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="history">{t('fallcheck.history')}</Label>
              <Input id="history" value={history} onChange={e => setHistory(e.target.value)} placeholder={t('fallcheck.historyPlaceholder')} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t('fallcheck.calculating') : useAI ? '🧠 AI Predict' : t('fallcheck.runCheck')}
              </Button>
              {residentId && (
                <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" type="button" disabled={pastChecks.length === 0}>
                      📋 History ({pastChecks.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Previous Fall Checks {selectedResident && `for ${selectedResident.name}`}
                      </DialogTitle>
                      <DialogDescription>
                        History for the selected resident
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      {pastChecks.map(check => (
                        <div key={check.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{format(new Date(check.createdAt), 'MMM dd, HH:mm')}</p>
                              {check.residentName && (
                                <Badge variant="outline" className="text-red-500 border-red-300 bg-red-50">
                                  {check.residentName}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Age {check.age} • {check.gait}</p>
                            {check.aiExplanation && (
                              <p className="text-xs text-blue-700 bg-blue-50 p-1 rounded mt-1">{check.aiExplanation}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{(check.confidence * 100).toFixed(0)}%</p>
                            <Badge variant={check.isFall ? 'destructive' : 'default'}>
                              {check.isFall ? 'High' : 'Low'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Last Check Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Risk Score:</span>
              <span className="text-lg font-bold">{(lastResult.confidence * 100).toFixed(0)}%</span>
              {useAI && <Badge variant="outline" className="text-blue-600 border-blue-300">AI</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Verdict:</span>
              <Badge variant={lastResult.isFall ? 'destructive' : 'default'}>
                {lastResult.isFall ? '⚠️ HIGH FALL RISK' : '✅ LOW RISK'}
              </Badge>
            </div>
            {lastResult.aiExplanation && (
              <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-900">
                🧠 {lastResult.aiExplanation}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}