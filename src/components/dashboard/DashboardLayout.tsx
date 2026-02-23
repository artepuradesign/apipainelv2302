import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from '../ThemeProvider';
import LoadingScreen from '@/components/layout/LoadingScreen';
import AnimatedBackground from './layout/AnimatedBackground';

import Sidebar from './layout/Sidebar';
import MenuSuperior from '../MenuSuperior';
import { createSidebarItems } from './layout/sidebarData';
import { usePanelMenus } from '@/hooks/usePanelMenus';
import UserNotifications from '@/components/notifications/UserNotifications';
import AdminNotifications from '@/components/notifications/AdminNotifications';
import { useNotificationDuplicationPrevention } from '@/hooks/useNotificationDuplicationPrevention';
import { toastNotificationManager } from '@/utils/toastNotificationManager';

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const { isSupport, user, loading, signOut } = useAuth();
  
  // Detectar tablet de forma reativa
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);
  const { panelMenus, isLoading: panelsLoading } = usePanelMenus();
  
  // Sidebar expandida em desktop (>1024px) por padrão
  // Para admin/suporte, sempre expandida em desktop e tablet
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const isDesktopOrTablet = window.innerWidth >= 768;
      // Admin/suporte: sempre expandido em desktop/tablet
      if (isSupport && isDesktopOrTablet) {
        return false;
      }
      return window.innerWidth <= 1024;
    }
    return false;
  });
  
  // Definir estado inicial apenas UMA VEZ no mount
  useEffect(() => {
    const isDesktopOrTablet = window.innerWidth >= 768;
    if (isSupport && isDesktopOrTablet) {
      setCollapsed(false);
    } else {
      const isDesktop = window.innerWidth > 1024;
      setCollapsed(!isDesktop);
    }
  }, [isSupport]);
  
  // Prevenir duplicação de notificações
  useNotificationDuplicationPrevention();

  // Limpeza automática de notificações antigas no localStorage (diária)
  useEffect(() => {
    const cleanup = () => {
      toastNotificationManager.cleanup();
    };
    
    // Executar limpeza a cada 24 horas
    const interval = setInterval(cleanup, 24 * 60 * 60 * 1000);
    
    // Executar uma vez no mount
    cleanup();
    
    return () => clearInterval(interval);
  }, []);
  
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // CORREÇÃO: Verificação mais robusta para evitar loop
  useEffect(() => {
    console.log('🔍 [DASHBOARD_LAYOUT] Estado atual:', {
      loading,
      hasUser: !!user,
      userId: user?.id,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    });

    // CRÍTICO: Só redirecionar se DEFINITIVAMENTE não há usuário E a verificação terminou
    if (!loading && !user) {
      console.log('🚨 [DASHBOARD_LAYOUT] REDIRECIONANDO - Sem usuário após loading completo');
      navigate('/login', { replace: true });
    } else if (!loading && user) {
      console.log('✅ [DASHBOARD_LAYOUT] Usuário autenticado confirmado:', user.email);
    }
  }, [user, loading, navigate, location.pathname]);

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <LoadingScreen 
        message="Carregando..." 
        variant="dashboard" 
      />
    );
  }

  // Se não há usuário, não renderizar nada (redirecionamento já aconteceu)
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      toast.success("Logout realizado com sucesso!");
      await signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
      window.location.href = '/login';
    }
  };

  const sidebarItems = createSidebarItems(handleLogout, isSupport, panelMenus);

  const isSubmenuActive = (subItems?: any[]) => {
    if (!subItems) return false;
    return subItems.some(subItem => location.pathname === subItem.path);
  };

  const handleSubmenuMouseEnter = () => {
    // Manter submenu aberto quando mouse está sobre ele
  };

  const handleSubmenuMouseLeave = () => {
    // Fechar submenu quando mouse sai
  };

  const handleSubItemClick = (subItem: any) => {
    if (subItem.onClick) {
      subItem.onClick();
    } else if (subItem.path !== '#') {
      navigate(subItem.path);
    }
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen relative`}>
      <AnimatedBackground />
      
      {/* Notificações de fundo para toasts */}
      <div className="fixed bottom-4 right-4 z-50">
        <UserNotifications />
        <AdminNotifications />
      </div>
      
      <div className="flex flex-col min-h-screen w-full overflow-hidden relative z-10">
        {/* Menu Superior - em todas as telas */}
        <MenuSuperior />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - mostrar em tablets (>=768px) e desktop */}
          {(isTablet || (!isMobile && !isTablet)) && (
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              mobileMenuOpen={mobileMenuOpen}
              filteredItems={sidebarItems}
              location={location}
              isMobile={isMobile}
              isTablet={isTablet}
              setMobileMenuOpen={setMobileMenuOpen}
              isSubmenuActive={isSubmenuActive}
              handleSubItemClick={handleSubItemClick}
            />
          )}
          
          {/* Main content - ajusta automaticamente ao tamanho da sidebar */}
          <main 
            className={`
              flex-1 
              overflow-y-auto 
              relative 
              z-20 
              transition-all 
              duration-300 
              ease-in-out
              ${isMobile ? 'p-2' : 'p-4 md:p-6'}
              ${!isMobile && !collapsed ? 'ml-0' : ''}
            `}
          >
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
