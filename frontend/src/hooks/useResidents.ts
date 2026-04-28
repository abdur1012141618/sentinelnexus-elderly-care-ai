import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

interface Resident {
  id: string;
  name: string;
  room: string | null;
  age: number | null;
  gait: string | null;
  notes?: string | null;
}

const fetchResidents = async (): Promise<Resident[]> => {
  try {
    const { data } = await apiClient.get('/residents');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch residents:', error);
    return [];
  }
};

export const useResidents = () => {
  return useQuery({
    queryKey: ['residents'],
    queryFn: fetchResidents,
    placeholderData: [],
  });
};

export const useCreateResident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newResident: Omit<Resident, 'id'>) =>
      apiClient.post('/residents', newResident),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
};