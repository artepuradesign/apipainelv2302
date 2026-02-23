import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cookieUtils } from '@/utils/cookieUtils';

// Interceptor global para requisições da API
export const useApiInterceptor = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    // Interceptar fetch global
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Verificar se é uma requisição para nossa API
      const url = typeof input === 'string' ? input : input.toString();
      const isApiRequest = url.includes('api.apipainel.com.br');

      if (isApiRequest && init) {
        // Adicionar token automaticamente se não foi especificado
        const token = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
        
        if (token) {
          const headers = new Headers(init.headers);
          
          // Só adicionar Authorization se não foi especificado
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          
          init.headers = headers;
        }
      }

      try {
        const response = await originalFetch(input, init);

        // Verificar se a resposta indica erro de autenticação
        if (isApiRequest && response.status === 401) {
          // Tentar identificar o motivo (ex: sessão revogada por novo login)
          let reason: string | null = null;
          let parsed: any = null;

          try {
            parsed = await response.clone().json();
            reason = parsed?.data?.reason || parsed?.reason || null;
          } catch {
            // ignore parse errors
          }

          // Caso especial: sessão única (logou em outro dispositivo)
          if (reason === 'logged_in_elsewhere') {
            const { dispatchSessionKicked } = await import('@/components/notifications/SessionKickedModal');
            dispatchSessionKicked({
              reason: 'logged_in_elsewhere',
              revoked_token_prefix: parsed?.data?.revoked_token_prefix,
              revoked_at: parsed?.data?.revoked_at,
              new_session: parsed?.data?.new_session,
            });
            return response;
          }

          // Ignorar 401 de endpoints não-críticos que podem falhar brevemente após login
          const nonCriticalEndpoints = ['/notifications', '/session-monitor', '/module-history/stats'];
          const isNonCritical = nonCriticalEndpoints.some(ep => url.includes(ep));

          if (isNonCritical) {
            console.warn('🔔 [API_INTERCEPTOR] 401 em endpoint não-crítico, ignorando logout:', url);
            return response;
          }

          console.log('🚫 [API_INTERCEPTOR] Status 401 detectado para:', url);

          // Verificar se realmente é um erro de autenticação
          const responseText = await response.clone().text();

          const isAuthError = responseText.includes('unauthorized') ||
                             responseText.includes('token') ||
                             responseText.includes('autenticação') ||
                             responseText.includes('authentication') ||
                             responseText.includes('expirado') ||
                             responseText.includes('expired');

          // Só fazer logout se for erro real de autenticação em endpoint crítico
          if (isAuthError) {
            // Verificar se o usuário realmente está logado (tem cookies)
            const hasToken = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
            if (hasToken) {
              console.log('🚫 [API_INTERCEPTOR] Erro de autenticação em endpoint crítico, redirecionando para logout');
              await signOut();
              window.location.href = '/logout';
            }
          }
        }

        return response;
      } catch (error) {
        console.error('❌ [API_INTERCEPTOR] Erro na requisição:', error);
        throw error;
      }
    };

    // Cleanup: restaurar fetch original quando o componente for desmontado
    return () => {
      window.fetch = originalFetch;
    };
  }, [signOut]);
};