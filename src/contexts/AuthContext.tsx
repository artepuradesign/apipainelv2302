
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApiService } from '@/services/authApiService';
import { userApiService } from '@/services/userApiService';
import { cookieUtils } from '@/utils/cookieUtils';
import { AuthUser, ApiUser } from '@/types/auth';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  user_role: 'assinante' | 'suporte' | 'admin';
}

interface Session {
  user: AuthUser;
}

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; redirectTo?: string; message?: string; statusCode?: string }>;
  refreshUser: () => Promise<void>;
  isSupport: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isSupport: false,
  signOut: async () => {},
  signIn: async () => ({ success: false }),
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const mapApiUserToAuthUser = (apiUser: ApiUser): AuthUser => {
  return {
    id: apiUser.id.toString(),
    email: apiUser.email,
    login: apiUser.login,
    full_name: apiUser.full_name,
    user_role: apiUser.user_role,
    saldo: apiUser.saldo || 0,
    saldo_plano: apiUser.saldo_plano,
    status: apiUser.status || 'ativo',
    tipoplano: apiUser.tipoplano || 'Pré-Pago',
    codigo_indicacao: apiUser.codigo_indicacao,
    cpf: apiUser.cpf,
    cnpj: apiUser.cnpj,
    data_nascimento: apiUser.data_nascimento,
    telefone: apiUser.telefone,
    cep: apiUser.cep,
    endereco: apiUser.endereco,
    numero: apiUser.numero,
    bairro: apiUser.bairro,
    cidade: apiUser.cidade,
    estado: apiUser.estado,
    tipo_pessoa: apiUser.tipo_pessoa,
    aceite_termos: apiUser.aceite_termos,
    email_verificado: apiUser.email_verificado,
    telefone_verificado: apiUser.telefone_verificado,
    ultimo_login: apiUser.ultimo_login,
    created_at: apiUser.created_at,
    updated_at: apiUser.updated_at,
    data_inicio: apiUser.data_inicio,
    data_fim: apiUser.data_fim,
    premium_enabled: apiUser.premium_enabled
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupport, setIsSupport] = useState(false);

  // Função para definir dados do usuário
  const setUserData = (apiUser: ApiUser) => {
    const userObj = mapApiUserToAuthUser(apiUser);
    
    const profileObj: Profile = {
      id: userObj.id,
      full_name: userObj.full_name,
      avatar_url: null,
      user_role: userObj.user_role
    };
    
    setUser(userObj);
    setSession({ user: userObj });
    setProfile(profileObj);
    setIsSupport(userObj.user_role === 'suporte' || userObj.user_role === 'admin');

    // Salvar cookies com duração de 30 minutos (0.0208 dias)
    cookieUtils.set('auth_user', JSON.stringify(userObj), 0.0208);
    cookieUtils.set('current_user_id', apiUser.id.toString(), 0.0208);
    
    // Salvar timestamp de última atividade
    localStorage.setItem(`last_activity_${apiUser.id}`, Date.now().toString());
    
    console.log('✅ [AUTH] Sessão salva com sucesso');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 [AUTH] Inicializando autenticação...');
      
      try {
        // Verificar se há dados salvos nos cookies (sessão)
        let savedUserData = cookieUtils.get('auth_user');
        let sessionToken = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
        let currentUserId = cookieUtils.get('current_user_id');
        
        if (savedUserData && sessionToken && currentUserId) {
          console.log('🔍 [AUTH] Cookies encontrados, verificando validade...');
          
          // Verificar se passou mais de 30 minutos desde a última atividade
          const lastActivity = localStorage.getItem(`last_activity_${currentUserId}`);
          const now = Date.now();
          const thirtyMinutes = 30 * 60 * 1000; // 30 minutos em milissegundos
          
          if (lastActivity) {
            const timeSinceLastActivity = now - parseInt(lastActivity);
            
            if (timeSinceLastActivity > thirtyMinutes) {
              console.log('⏰ [AUTH] Sessão expirada (mais de 30 minutos de inatividade)');
              // Limpar dados expirados
              cookieUtils.remove('auth_user');
              cookieUtils.remove('session_token');
              cookieUtils.remove('api_session_token');
              cookieUtils.remove('current_user_id');
              localStorage.removeItem(`last_activity_${currentUserId}`);
              setLoading(false);
              return;
            }
          }
          
          console.log('✅ [AUTH] Sessão válida - Restaurando usuário');
          
          // Restaurar usuário
          const userData = JSON.parse(savedUserData);
          const userObj = userData;
          const profileObj: Profile = {
            id: userObj.id,
            full_name: userObj.full_name,
            avatar_url: null,
            user_role: userObj.user_role
          };
          
          setUser(userObj);
          setSession({ user: userObj });
          setProfile(profileObj);
          setIsSupport(userObj.user_role === 'suporte' || userObj.user_role === 'admin');
          
          // Atualizar timestamp de atividade
          localStorage.setItem(`last_activity_${currentUserId}`, now.toString());
          
          setLoading(false);
          
          console.log('✅ [AUTH] SESSÃO RESTAURADA - Usuário:', userObj.email, 'Role:', userObj.user_role);
          
          // DESABILITADO: Validação de token em background que estava causando logout
          /*
          // Validar token em background
          try {
            console.log('🔄 [AUTH] Validando token em background...');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.artepuradesign.com.br'}/auth/validate-token`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (!response.ok) {
              console.log('❌ [AUTH] Token inválido, fazendo logout...');
              await signOut();
            } else {
              console.log('✅ [AUTH] Token válido confirmado');
            }
          } catch (bgError) {
            console.warn('⚠️ [AUTH] Erro na validação background, mantendo sessão:', bgError);
          }
          */
        } else {
          console.log('ℹ️ [AUTH] Nenhuma sessão completa encontrada');
          setLoading(false);
        }
        
      } catch (error) {
        console.error('❌ [AUTH] Erro na inicialização:', error);
        // Limpar dados corrompidos
        cookieUtils.remove('auth_user');
        cookieUtils.remove('session_token');
        cookieUtils.remove('api_session_token');
        cookieUtils.remove('current_user_id');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 [AUTH] Iniciando login...');
      
      const apiResult = await authApiService.login({
        email: email,
        password: password
      });

      if (apiResult.success && apiResult.data) {
        console.log('✅ [AUTH] Login bem-sucedido');
        
        const { user: apiUser, token, session_token } = apiResult.data;
        
        // Salvar token com duração de 30 minutos (0.0208 dias)
        const finalSessionToken = session_token || token;
        cookieUtils.set('session_token', finalSessionToken, 0.0208);
        
        // Definir dados do usuário
        setUserData(apiUser);
        
        const redirectTo = apiUser.user_role === 'suporte' ? '/dashboard/admin' : '/dashboard';
        
        return {
          success: true,
          redirectTo: redirectTo
        };
      }
      
      return {
        success: false,
        message: apiResult.message || 'Erro no login',
        statusCode: apiResult.statusCode
      };
      
    } catch (error) {
      console.error('❌ [AUTH] Erro no login:', error);
      return {
        success: false,
        message: 'Erro interno no login'
      };
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 [AUTH] Atualizando dados do usuário...');
      const response = await userApiService.getUserData();
      if (response.success && response.data) {
        const apiUser = response.data as unknown as ApiUser;
        
        // Mesclar com dados existentes para preservar campos que a API pode não retornar
        // (ex: data_inicio, data_fim podem não vir no /wallet/profile)
        if (user) {
          const mergedUser: ApiUser = {
            ...{ 
              id: parseInt(user.id), 
              login: user.login,
              email: user.email,
              full_name: user.full_name,
              user_role: user.user_role,
              saldo: user.saldo,
              saldo_plano: user.saldo_plano,
              status: user.status,
              tipoplano: user.tipoplano,
              data_inicio: user.data_inicio,
              data_fim: user.data_fim,
            },
            ...apiUser,
          };
          // Preservar campos que existiam antes mas vieram undefined/null na resposta
          if (!mergedUser.data_inicio && user.data_inicio) {
            mergedUser.data_inicio = user.data_inicio;
          }
          if (!mergedUser.data_fim && user.data_fim) {
            mergedUser.data_fim = user.data_fim;
          }
          setUserData(mergedUser);
        } else {
          setUserData(apiUser);
        }
        console.log('✅ [AUTH] Dados do usuário atualizados');
      }
    } catch (error) {
      console.warn('⚠️ [AUTH] Erro ao atualizar dados do usuário:', error);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 [AUTH] Iniciando logout MANUAL...');
      
      const sessionToken = cookieUtils.get('session_token');
      
      if (sessionToken) {
        try {
          await authApiService.logout(sessionToken);
          console.log('✅ [AUTH] Logout realizado no servidor');
        } catch (error) {
          console.warn('⚠️ [AUTH] Erro no logout do servidor:', error);
        }
      }
      
      console.log('🧹 [AUTH] Limpando todos os dados locais...');
      
      cookieUtils.remove('session_token');
      cookieUtils.remove('current_user_id');
      cookieUtils.remove('auth_user');
      
      const userId = cookieUtils.get('current_user_id');
      if (userId) {
        localStorage.removeItem(`last_activity_${userId}`);
      }
      localStorage.removeItem('auth_user');
      localStorage.removeItem('session_token');
      localStorage.removeItem('current_user_id');
      localStorage.removeItem('token_last_validation');
      
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsSupport(false);
      
      console.log('✅ [AUTH] Logout completo');
      
    } catch (error) {  
      console.error('❌ [AUTH] Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signOut,
        signIn,
        refreshUser,
        isSupport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
