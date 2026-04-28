import { useState } from 'react';
import { useResidents } from '@/hooks/useResidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface FallCheckResult {
  id: string;
  age: number;
  confidence: number;
  gait: string;
  history: string | null;
  isFall: boolean;
  createdAt: string;
  residentName?: string; // ← নতুন ফিল্ড (আমরা লোকালি বসাব)
}

export default function FallCheck() {
  const { data: residents } = useResidents();
  const [residentId, setResidentId] = useState('');
  const [age, setAge] = useState('');
  const [gait, setGait] = useState('');
  const [history, setHistory] = useState('');
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
        // প্রতিটি চেকের সাথে residentName বসিয়ে দিচ্ছি যাতে পরে দেখাতে পারি
        const checksWithName = data.map((check: FallCheckResult) => ({
          ...check,
          residentName: residents?.find(r => r.id === value)?.name || 'Unknown',
        }));
        setPastChecks(checksWithName);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentId || !age || !gait) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/fall-checks', {
        residentId,
        age: parseInt(age),
        gait,
        history: history || null,
      });
      // নতুন চেকেও residentName যোগ করি
      const newCheck = {
        ...data,
        residentName: selectedResident?.name || 'Unknown',
      };
      setLastResult(newCheck);
      setPastChecks(prev => [newCheck, ...prev]);
    } catch (err) {
      console.error('Fall check failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🧠 Fall Risk Prediction</h1>

      <Card>
        <CardHeader>
          <CardTitle>Run Fall Check</CardTitle>
          <CardDescription>Enter assessment parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <Label>Resident</Label>
              <Select onValueChange={handleResidentChange} value={residentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resident" />
                </SelectTrigger>
                <SelectContent>
                  {residents?.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g., 78" />
            </div>
            <div>
              <Label htmlFor="gait">Gait</Label>
              <Select onValueChange={setGait} value={gait}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gait" />
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
              <Label htmlFor="history">History (optional)</Label>
              <Input id="history" value={history} onChange={e => setHistory(e.target.value)} placeholder="e.g., previous falls, medications" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Calculating...' : 'Run Fall Check'}
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
                      {pastChecks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No previous checks.</p>
                      ) : (
                        pastChecks.map(check => (
                          <div key={check.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">{format(new Date(check.createdAt), 'MMM dd, HH:mm')}</p>
                                {/* রোগীর নামের ব্যাজ */}
                                {check.residentName && (
                                  <Badge variant="outline" className="text-red-500 border-red-300 bg-red-50">
                                    {check.residentName}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">Age {check.age} • {check.gait}</p>
                              {check.history && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{check.history}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{(check.confidence * 100).toFixed(0)}%</p>
                              <Badge variant={check.isFall ? 'destructive' : 'default'}>
                                {check.isFall ? 'High' : 'Low'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Latest Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Last Check Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Risk Score:</span>
              <span className="text-lg font-bold">{(lastResult.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Verdict:</span>
              <Badge variant={lastResult.isFall ? 'destructive' : 'default'}>
                {lastResult.isFall ? '⚠️ HIGH FALL RISK' : '✅ LOW RISK'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}