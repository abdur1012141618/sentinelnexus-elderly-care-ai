import { useState } from 'react';
import { useResidents } from '@/hooks/useResidents';
import { useResidentVitals, useCreateVital } from '@/hooks/useVitals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Vitals() {
  const { data: residents } = useResidents();
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const { data: vitals, isLoading } = useResidentVitals(selectedResidentId);
  const createVital = useCreateVital();

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [spo2, setSpo2] = useState('');

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) return;
    await createVital.mutateAsync({
      residentId: selectedResidentId,
      heartRate: heartRate ? parseInt(heartRate) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      systolic: systolic ? parseInt(systolic) : null,
      diastolic: diastolic ? parseInt(diastolic) : null,
      spo2: spo2 ? parseInt(spo2) : null,
    });
    setDialogOpen(false);
    // clear form
    setHeartRate(''); setTemperature(''); setSystolic(''); setDiastolic(''); setSpo2('');
  };

  // Prepare chart data (last 7 days, but we'll just use all fetched vitals)
  const chartData = vitals?.slice().reverse().map(v => ({
    date: format(new Date(v.createdAt), 'MMM dd, HH:mm'),
    heartRate: v.heartRate,
    temperature: v.temperature,
    systolic: v.systolic,
    diastolic: v.diastolic,
    spo2: v.spo2,
  })) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vitals Tracking</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedResidentId}>Record Vitals</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record New Vitals</DialogTitle>
              <DialogDescription>
                Enter the measurements for the selected resident.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVital} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input id="heartRate" type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input id="temperature" type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="systolic">Systolic (mmHg)</Label>
                  <Input id="systolic" type="number" value={systolic} onChange={e => setSystolic(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
                  <Input id="diastolic" type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="spo2">SpO₂ (%)</Label>
                <Input id="spo2" type="number" value={spo2} onChange={e => setSpo2(e.target.value)} />
              </div>
              <Button type="submit" disabled={createVital.isPending} className="w-full">
                {createVital.isPending ? 'Saving...' : 'Save Vitals'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resident Selector */}
      <div className="w-64">
        <Select onValueChange={setSelectedResidentId} value={selectedResidentId}>
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

      {selectedResidentId && (
        <div className="space-y-6">
          {/* Latest vitals table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Vitals</CardTitle>
              <CardDescription>Latest measurements</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <p>Loading...</p> : vitals && vitals.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2">HR</th>
                      <th className="px-4 py-2">Temp</th>
                      <th className="px-4 py-2">BP</th>
                      <th className="px-4 py-2">SpO₂</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitals.map(v => (
                      <tr key={v.id}>
                        <td className="px-4 py-2">{format(new Date(v.createdAt), 'MMM dd, HH:mm')}</td>
                        <td className="px-4 py-2 text-center">{v.heartRate ?? '—'}</td>
                        <td className="px-4 py-2 text-center">{v.temperature ?? '—'}</td>
                        <td className="px-4 py-2 text-center">
                          {v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-center">{v.spo2 ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No vitals recorded yet.</p>}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heart Rate Chart */}
            <Card>
              <CardHeader><CardTitle>Heart Rate</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="heartRate" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Temperature Chart */}
            <Card>
              <CardHeader><CardTitle>Temperature</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Blood Pressure Chart */}
            <Card>
              <CardHeader><CardTitle>Blood Pressure</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                    <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* SpO2 Chart */}
            <Card>
              <CardHeader><CardTitle>SpO₂</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}