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
  try {
    const { data } = await apiClient.get('/alerts');
    // যদি অ্যারে না আসে (যেমন এরর অবজেক্ট), তাহলে খালি অ্যারে ফেরত দিচ্ছি
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return [];
  }
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30000,
    // প্রাথমিক ডেটা হিসেবে খালি অ্যারে দিয়ে দিচ্ছি যাতে ড্যাশ ক্র্যাশ না করে
    placeholderData: [],
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