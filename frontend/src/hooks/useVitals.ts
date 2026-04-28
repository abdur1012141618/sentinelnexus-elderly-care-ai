import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface VitalRecord {
  id: string;
  residentId: string;
  heartRate: number | null;
  temperature: number | null;
  systolic: number | null;
  diastolic: number | null;
  spo2: number | null;
  notes: string | null;
  createdAt: string;
  resident?: { name: string };
}

const fetchVitals = async (): Promise<VitalRecord[]> => {
  const { data } = await apiClient.get('/vitals');
  return data;
};

const fetchResidentVitals = async (residentId: string): Promise<VitalRecord[]> => {
  const { data } = await apiClient.get(`/vitals/${residentId}`);
  return data;
};

export const useVitals = () => {
  return useQuery({
    queryKey: ['vitals'],
    queryFn: fetchVitals,
  });
};

export const useResidentVitals = (residentId: string) => {
  return useQuery({
    queryKey: ['vitals', residentId],
    queryFn: () => fetchResidentVitals(residentId),
    enabled: !!residentId,
  });
};

export const useCreateVital = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newVital: Omit<VitalRecord, 'id' | 'createdAt' | 'resident'>) =>
      apiClient.post('/vitals', newVital),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitals'] });
    },
  });
};