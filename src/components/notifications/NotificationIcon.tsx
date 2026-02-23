import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { setNotificationRefreshCallback } from '@/utils/notificationRefresh';
import { useEffect } from 'react';

interface NotificationIconProps {
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const { notifications, unreadCount, markAsRead, deleteNotification, isLoading, refresh } = useNotifications(true, 30000);
  const navigate = useNavigate();

  // Debug logs
  console.log('🔔 NotificationIcon - unreadCount:', unreadCount);
  console.log('🔔 NotificationIcon - notifications:', notifications.length);
  console.log('🔔 NotificationIcon - user:', user?.id);

  // Registrar callback global para refresh
  useEffect(() => {
    if (refresh) {
      setNotificationRefreshCallback(refresh);
    }
  }, [refresh]);

  // Atualizar badge quando recargas forem completadas
  useEffect(() => {
    const handleRechargeCompleted = () => {
      try {
        console.log('🔔 NotificationIcon: Recarga detectada, atualizando...');
        refresh();
      } catch (e) {
        console.warn('Falha ao atualizar notificações via evento de recarga:', e);
      }
    };
    window.addEventListener('rechargeCompleted', handleRechargeCompleted as EventListener);
    return () => window.removeEventListener('rechargeCompleted', handleRechargeCompleted as EventListener);
  }, [refresh]);

  // Só renderizar se usuário estiver logado
  if (loading || !user) {
    return null;
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida se ainda não foi
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navegar para a página de detalhes
    navigate(`/notifications/${notification.id}`);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Erro ao fechar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
    // Forçar popover a permanecer aberto após a operação
    setIsOpen(true);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative hover:bg-accent ${className}`}
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h3 className="font-semibold">Notificações</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando notificações...
            </div>
          ) : recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-b p-4 hover:bg-accent cursor-pointer relative ${
                  !notification.is_read ? 'bg-accent/50' : ''
                }`}
                onClick={(e) => {
                  // Não navegar se clicou no botão X
                  if ((e.target as HTMLElement).closest('button')) return;
                  handleNotificationClick(notification);
                }}
              >
                <div className="flex flex-col items-start text-left gap-2">
                  {/* Botão fechar no canto superior direito */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-destructive/10"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="w-full pr-8 space-y-1">
                    <p className="font-medium text-sm leading-none">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {notification.type === 'user_recharge_success' && (
                      <p className="text-xs text-green-600 font-medium">
                        ✅ Recarga confirmada
                      </p>
                    )}
                    {notification.type === 'admin_recharge_alert' && (
                      <p className="text-xs text-orange-600 font-medium">
                        🔔 Nova recarga detectada
                      </p>
                    )}
                    {(notification.type === 'recharge' || notification.type.includes('recharge')) && (
                      <p className="text-xs text-primary font-medium">
                        💰 Recarga realizada
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação encontrada
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationIcon;