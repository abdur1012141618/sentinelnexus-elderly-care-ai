import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResidents } from '@/hooks/useResidents';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/api/client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TimelinePoint {
  day: number;
  date: string;
  predictedHeartRate: number | null;
  predictedTemperature: number | null;
  predictedSystolic: number | null;
  predictedDiastolic: number | null;
  predictedSpo2: number | null;
  riskLevel: number;
}

export default function HealthTimeline() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: residents } = useResidents();
  const [residentId, setResidentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [residentName, setResidentName] = useState('');

  const generatePrediction = async () => {
    if (!residentId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/predict-health/${residentId}`);
      setTimeline(data.timeline);
      setRiskScore(data.prediction.riskScore);
      setResidentName(data.resident.name);
      toast({
        title: 'Prediction Ready',
        description: `30-day health timeline generated for ${data.resident.name}`,
      });
    } catch (err: any) {
      toast({
        title: 'Prediction Failed',
        description: err?.response?.data?.error || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = () => {
    if (!riskScore) return null;
    if (riskScore >= 0.7) return <Badge variant="destructive">High Risk ({(riskScore * 100).toFixed(0)}%)</Badge>;
    if (riskScore >= 0.4) return <Badge variant="secondary">Medium Risk ({(riskScore * 100).toFixed(0)}%)</Badge>;
    return <Badge variant="default">Low Risk ({(riskScore * 100).toFixed(0)}%)</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🧬 Digital Twin: Health Timeline</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate 30-Day Prediction</CardTitle>
          <CardDescription>
            AI-powered health forecast based on vitals, fall history, and age
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select onValueChange={setResidentId} value={residentId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a resident" />
              </SelectTrigger>
              <SelectContent>
                {residents?.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generatePrediction} disabled={loading || !residentId}>
              {loading ? 'Generating...' : '🔮 Generate Prediction'}
            </Button>
          </div>
          {riskScore !== null && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium">Overall Risk:</span>
              {getRiskBadge()}
            </div>
          )}
        </CardContent>
      </Card>

      {timeline.length > 0 && (
        <div className="space-y-6">
          {/* Heart Rate Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>❤️ Predicted Heart Rate (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom' }} />
                  <YAxis domain={[40, 140]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="predictedHeartRate" stroke="#ef4444" strokeWidth={2} name="Heart Rate" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Blood Pressure Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>💉 Predicted Blood Pressure (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="predictedSystolic" stroke="#3b82f6" strokeWidth={2} name="Systolic" />
                  <Line type="monotone" dataKey="predictedDiastolic" stroke="#10b981" strokeWidth={2} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SpO2 Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>🫁 Predicted SpO₂ (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="predictedSpo2" stroke="#8b5cf6" strokeWidth={2} name="SpO₂" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Level Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>⚠️ Predicted Risk Level (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="riskLevel" stroke="#f59e0b" strokeWidth={3} name="Risk Level" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}