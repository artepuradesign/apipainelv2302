import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cookieUtils } from '@/utils/cookieUtils';

export const useAuthGuard = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const validateTokenOnRouteChange = async () => {
      // Não validar se ainda está carregando
      if (loading) return;

      // Rotas públicas que não precisam de autenticação
      const publicRoutes = ['/', '/login', '/registration', '/forgot-password', '/auth-loading', '/planos-publicos', '/indicacoes'];
      const isPublicRoute = publicRoutes.includes(location.pathname);

      if (isPublicRoute) return;

      // CRÍTICO: Verificar se usuário e token existem
      if (!user) {
        console.log('🚫 [AUTH_GUARD] Usuário não autenticado, redirecionando para login');
        navigate('/login', { replace: true });
        return;
      }

      // Verificar se ainda tem token de sessão válido
      const sessionToken = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
      const authUser = cookieUtils.get('auth_user');
      
      if (!sessionToken || !authUser) {
        console.log('🚫 [AUTH_GUARD] Sessão expirada (cookies ausentes), redirecionando para login');
        await signOut();
        navigate('/login', { replace: true });
        return;
      }

      console.log('✅ [AUTH_GUARD] Sessão válida - usuário autenticado');
    };

    // Só executar a validação se realmente mudou de rota
    const timeoutId = setTimeout(validateTokenOnRouteChange, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, user, loading, signOut, navigate]);

  return { isAuthenticated: !!user && !loading };
};