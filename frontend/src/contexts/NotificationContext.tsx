import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Notification } from '../backend';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const prevCountRef = useRef(0);

  const userId = identity?.getPrincipal();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getNotifications(userId);
    },
    enabled: !!actor && !actorFetching && !!userId,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!actor || !userId) throw new Error('Not authenticated');
      await actor.markNotificationAsRead(userId, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId?.toString()] });
    },
  });

  // Show toast for new notifications
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length > prevCountRef.current && prevCountRef.current > 0) {
      const latest = unread[0];
      if (latest) {
        toast(latest.message, {
          description: new Date(Number(latest.createdAt) / 1_000_000).toLocaleString(),
          duration: 5000,
        });
      }
    }
    prevCountRef.current = unread.length;
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead: markReadMutation.mutate,
      isLoading,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
