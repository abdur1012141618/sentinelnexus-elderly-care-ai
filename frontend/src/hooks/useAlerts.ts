import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface Alert {
  id: string;
  type: string;
  severity: string;
  isOpen: boolean;
  metadata: any;
  createdAt: string;
  resident?: { name: string };
  residentId?: string;
}

const fetchAlerts = async (): Promise<Alert[]> => {
  const { data } = await apiClient.get('/alerts');
  return data;
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30000, // ৩০সেকেন্ড পর পর রিফ্রেশ
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiClient.patch(`/alerts/${alertId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};