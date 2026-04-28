import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Vitals() {
  const { t } = useTranslation();
  const { data: residents } = useResidents();
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const { data: vitals, isLoading } = useResidentVitals(selectedResidentId);
  const createVital = useCreateVital();

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
      notes: null, // টাইপের সাথে মিলিয়ে রাখার জন্য null যোগ করা হয়েছে
    });
    setDialogOpen(false);
    setHeartRate(''); setTemperature(''); setSystolic(''); setDiastolic(''); setSpo2('');
  };

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
        <h1 className="text-2xl font-bold">{t('vitals.title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedResidentId}>{t('vitals.recordVitals')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('vitals.dialogTitle')}</DialogTitle>
              <DialogDescription>{t('vitals.dialogDescription')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVital} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="heartRate">{t('vitals.heartRateLabel')}</Label>
                <Input id="heartRate" type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="temperature">{t('vitals.temperatureLabel')}</Label>
                <Input id="temperature" type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="systolic">{t('vitals.systolicLabel')}</Label>
                  <Input id="systolic" type="number" value={systolic} onChange={e => setSystolic(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="diastolic">{t('vitals.diastolicLabel')}</Label>
                  <Input id="diastolic" type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="spo2">{t('vitals.spo2Label')}</Label>
                <Input id="spo2" type="number" value={spo2} onChange={e => setSpo2(e.target.value)} />
              </div>
              <Button type="submit" disabled={createVital.isPending} className="w-full">
                {createVital.isPending ? t('vitals.savingVitals') : t('vitals.saveVitals')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-64">
        <Select onValueChange={setSelectedResidentId} value={selectedResidentId}>
          <SelectTrigger>
            <SelectValue placeholder={t('vitals.selectResident')} />
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
          <Card>
            <CardHeader>
              <CardTitle>{t('vitals.recentVitals')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <p>Loading...</p> : vitals && vitals.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">{t('vitals.date')}</th>
                      <th className="px-4 py-2">{t('vitals.heartRate')}</th>
                      <th className="px-4 py-2">{t('vitals.temperature')}</th>
                      <th className="px-4 py-2">{t('vitals.bloodPressure')}</th>
                      <th className="px-4 py-2">{t('vitals.spo2')}</th>
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
              ) : <p>{t('vitals.noVitals')}</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{t('vitals.heartRateChart')}</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>{t('vitals.temperatureChart')}</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>{t('vitals.bloodPressureChart')}</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>{t('vitals.spo2Chart')}</CardTitle></CardHeader>
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