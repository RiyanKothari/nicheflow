import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
}

export function useGetMe({ query }: { query?: { enabled?: boolean; retry?: boolean } } = {}) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      return {
        id: user.id,
        email: user.email!,
        name: profile?.name || user.email!.split('@')[0],
        workspaceId: profile?.workspace_id || ''
      } as User;
    },
    ...query,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: any) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async ({ email, password, name }: any) => {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name } }
      });
      if (error) throw error;
      return data;
    }
  });
}

export function useGetDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single();
      const workspaceId = profile?.workspace_id;
      if (!workspaceId) throw new Error('No workspace');

      const { data: summary } = await supabase.rpc('get_business_summary', { p_workspace_id: workspaceId });
      
      const { data: recentBookings } = await supabase.from('bookings').select('id, title:notes, scheduledAt:start_time, amount:price, status').eq('workspace_id', workspaceId).order('start_time', { ascending: false }).limit(3);
      const { data: clients } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);

      return {
        todayBookings: summary?.bookings_today || 0,
        pendingInvoices: summary?.invoices_unpaid > 0 ? 1 : 0, // Mocked pending invoice count
        pendingInvoicesAmount: summary?.invoices_unpaid || 0,
        totalClients: clients?.count || 0,
        overdueTasks: summary?.tasks_overdue || 0,
        pendingTasks: 0,
        totalRevenue: summary?.revenue_mtd || 0,
        recentBookings: recentBookings || [],
        recentActivity: [],
        revenueLast7Days: []
      };
    }
  });
}

export function useGetClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: any) => {
      const { data, error } = await supabase.from('clients').insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });
}

export function useGetBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*, clients(*), services(*)');
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: any) => {
      const { data, error } = await supabase.from('bookings').insert(booking).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });
}

export function setAuthTokenGetter(getter: () => string | null) {
  // Not needed for Supabase as it manages its own session, but kept for compatibility
}
