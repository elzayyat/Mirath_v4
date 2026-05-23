import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
export function useNotifications(){ const {user}=useAuth(); return useQuery({queryKey:['notifications',user?.id],queryFn:async()=>[],enabled:!!user}); }
export function useUnreadCount(){ const {user}=useAuth(); return useQuery({queryKey:['notifications-unread',user?.id],queryFn:async()=>0,enabled:!!user,refetchInterval:30000}); }
export function useMarkRead(){ const qc=useQueryClient(); return useMutation({mutationFn:async()=>{},onSuccess:()=>{qc.invalidateQueries({queryKey:['notifications']});qc.invalidateQueries({queryKey:['notifications-unread']});}}); }
export function useMarkAllRead(){ const qc=useQueryClient(); return useMutation({mutationFn:async()=>{},onSuccess:()=>{qc.invalidateQueries({queryKey:['notifications']});qc.invalidateQueries({queryKey:['notifications-unread']});}}); }
