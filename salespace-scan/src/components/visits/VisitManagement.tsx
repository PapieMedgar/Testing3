import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI, managerAPI, type CheckIn } from '@/lib/api';
import { VisitFilterBar } from './VisitFilterBar';
import { VisitList } from './VisitList';
import { authAPI } from '@/lib/api';

interface FilterState {
  managerId?: number;
  agentId?: number;
  fromDate?: string;
  toDate?: string;
  status?: string;
}

export const VisitManagement = () => {
  const [filters, setFilters] = useState<FilterState>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const user = authAPI.getStoredUser();
    setIsAdmin(user?.role === 'ADMIN');
  }, []);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits', filters],
    queryFn: () => adminAPI.getAllVisits(filters) as Promise<CheckIn[]>
  });

  const handleStatusChange = async (visitId: number, newStatus: string) => {
    try {
      await managerAPI.updateCheckInStatus(visitId, newStatus);
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    } catch (error) {
      console.error('Failed to update visit status:', error);
      // You might want to show a toast notification here
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <VisitFilterBar onFilterChange={setFilters} />
      <VisitList visits={visits} onStatusChange={handleStatusChange} />
    </div>
  );
};
