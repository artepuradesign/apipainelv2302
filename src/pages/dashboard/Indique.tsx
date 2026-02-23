import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, RefreshCw, Trash2, Wallet, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReferralCode from '@/components/minha-conta/ReferralCode';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';
import { useAuth } from '@/contexts/AuthContext';
import { walletApiService } from '@/services/walletApiService';
import { systemConfigService } from '@/services/systemConfigService';
import { bonusConfigService } from '@/services/bonusConfigService';
import { toast } from 'sonner';

const Indique = () => {
  const { user } = useAuth();
  const [referralEarnings, setReferralEarnings] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [config, setConfig] = useState({
    referral_system_enabled: true,
    referral_bonus_enabled: true,
    referral_commission_enabled: false,
    referral_bonus_amount: 5.0,
    referral_commission_percentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('indicacoes');

  const referralCode = user?.codigo_indicacao || '';
  const currentDomain = window.location.origin;
  const referralLink = `${currentDomain}/registration?ref=${referralCode}`;

  const loadReferralData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [INDIQUE] Carregando dados da API externa...');
      
      // Obter valor dinâmico do arquivo bonus.php
      const bonusAmount = await bonusConfigService.getBonusAmount();
      console.log('✅ [INDIQUE] Valor dinâmico do bônus do bonus.php:', bonusAmount);
      
      // Configurações com valor dinâmico da API
      const configData = {
        referral_system_enabled: true,
        referral_bonus_enabled: true,
        referral_commission_enabled: false,
        referral_bonus_amount: bonusAmount,
        referral_commission_percentage: 0
      };
      
      setConfig(configData);
      console.log('📋 [INDIQUE] Configurações atualizadas com valor da API:', configData);
      
      // Carregar histórico de transações da API externa (igual ao histórico)
      const transactionsResponse = await walletApiService.getTransactionHistory(parseInt(user.id), 100);
      
      let allHistoryData: any[] = [];
      let apiReferralEarnings: any[] = [];
      
      if (transactionsResponse.success && transactionsResponse.data) {
        allHistoryData = transactionsResponse.data.map((t: any) => ({
          id: t.id?.toString() || Date.now().toString(),
          user_id: user.id,
          amount: parseFloat(t.amount) || 0,
          type: t.type || 'credit',
          description: t.description || 'Transação',
          created_at: t.created_at || new Date().toISOString(),
          balance_type: t.wallet_type === 'plan' ? 'plan' : 'wallet',
          payment_method: t.payment_method || '',
          status: t.status || 'completed',
          category: t.type === 'indicacao' || t.type === 'bonus' || 
                   (t.description && (
                     t.description.includes('Bônus') || 
                     t.description.includes('indicação') ||
                     t.description.includes('boas-vindas') ||
                     t.description.includes('welcome')
                   )) 
                   ? 'bonus' : 'normal'
        }));
        
        // Extrair dados de indicação das transações
        apiReferralEarnings = transactionsResponse.data
          .filter((t: any) => t.type === 'indicacao')
          .map((t: any) => {
            // Tentar extrair nome de diferentes padrões na descrição
            let referredName = 'Usuário indicado';
            
            console.log('🔍 [INDIQUE] Processando transação de indicação:', t.description);
            if (t.description) {
              // Padrão 1: "- Nome se cadastrou"
              let match = t.description.match(/- (.*?) se cadastrou/);
              if (!match) {
                // Padrão 2: "Nome se cadastrou"
                match = t.description.match(/(.*?) se cadastrou/);
              }
              if (!match) {
                // Padrão 3: "Bônus de indicação - Nome"
                match = t.description.match(/Bônus de indicação - (.*?)$/);
              }
              if (!match) {
                // Padrão 4: "Indicação de Nome"
                match = t.description.match(/Indicação de (.*?)$/);
              }
              
              if (match && match[1]) {
                referredName = match[1].trim();
              }
            }
            
            return {
              id: t.id?.toString() || Date.now().toString(),
              referrer_id: user.id,
              referred_user_id: t.id,
              amount: parseFloat(t.amount) || bonusAmount,
              created_at: t.created_at || new Date().toISOString(),
              status: 'paid',
              referred_name: referredName
            };
          });
        
        console.log('✅ [INDIQUE] Transações carregadas:', allHistoryData.length);
        console.log('✅ [INDIQUE] Indicações extraídas:', apiReferralEarnings.length);
      }
      
      // Ordenar todos os dados por data
      allHistoryData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setAllTransactions(allHistoryData);
      setReferralEarnings(apiReferralEarnings);
      
      console.log('🔍 [DEBUG] Dados finais de referralEarnings:', apiReferralEarnings);
      apiReferralEarnings.forEach((earning, index) => {
        console.log(`🔍 [DEBUG] Earning ${index}:`, {
          id: earning.id,
          referred_name: earning.referred_name,
          amount: earning.amount,
          created_at: earning.created_at
        });
      });
      
      if (allHistoryData.length === 0) {
        throw new Error('Nenhum dado encontrado na API');
      }
      
    } catch (error) {
      console.error('❌ [INDIQUE] Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
      
      // Fallback para dados locais
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback para dados locais
  const loadLocalData = () => {
    if (!user) return;
    
    try {
      const localTransactions = JSON.parse(localStorage.getItem(`balance_transactions_${user.id}`) || '[]');
      setAllTransactions(localTransactions);
      setReferralEarnings([]);
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error);
    }
  };

  const forceRefreshData = async () => {
    console.log('🔄 [INDIQUE] Forçando atualização dos dados...');
    await loadReferralData();
  };

  useEffect(() => {
    loadReferralData();
  }, [user?.id]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch (error) {
      return dateString;
    }
  };

  const clearReferrals = () => {
    setReferralEarnings([]);
    toast.success('Histórico de indicações limpo');
  };

  const clearAllHistory = () => {
    setAllTransactions([]);
    setReferralEarnings([]);
    toast.success('Histórico limpo');
  };

  const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="text-center py-12">
      {isLoading ? (
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <p className="text-gray-500">Carregando dados via API...</p>
        </div>
      ) : (
        <>
          <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            {title}
          </p>
          <p className="text-sm text-gray-400">
            {subtitle}
          </p>
        </>
      )}
    </div>
  );

  if (isLoading && !referralCode) {
    return (
      <div className="space-y-4 sm:space-y-6 relative z-10 px-1 sm:px-0">
        <DashboardTitleCard
          title="Programa de Indicação"
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Programa de Indicação
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Carregando seus dados de indicação...
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!referralCode) {
    return (
      <div className="space-y-4 sm:space-y-6 relative z-10 px-1 sm:px-0">
        <DashboardTitleCard
          title="Programa de Indicação"
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Programa de Indicação
            </CardTitle>
          </CardHeader>
        </Card>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Código de Indicação Não Encontrado
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                Entre em contato com o suporte para gerar seu código de indicação.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-1 sm:px-0">
      <DashboardTitleCard
        title="Programa de Indicação"
        icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
      />
      {/* Layout responsivo: 2 colunas no desktop, 1 coluna no mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Coluna 1: Meu Código de Indicação */}
        <Card className="bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              Meu Código de Indicação
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground">
              Compartilhe seu código e ganhe bônus quando alguém se cadastrar
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ReferralCode 
              codigoIndicacao={referralCode}
            />
          </CardContent>
        </Card>

        {/* Coluna 2: Estatísticas Resumidas */}
        <Card className="bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base md:text-lg">Resumo de Indicações</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground">
              Veja suas estatísticas de indicação
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {referralEarnings.length}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Total de Indicações</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(referralEarnings.reduce((sum, ref) => sum + ref.amount, 0))}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Total de Bônus</p>
                </div>
              </div>
            </div>

            {/* Informação sobre o valor do bônus */}
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Ganhe {formatCurrency(config.referral_bonus_amount)} por indicação!
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Cada vez que alguém usa seu código
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bônus por Indicação - Largura Total */}
      <Card className="bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-base md:text-lg">Histórico de Bônus por Indicação</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Veja todas as pessoas que você indicou e os bônus recebidos
              </p>
            </div>
            {user?.user_role === 'suporte' && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={clearReferrals}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Indicações
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {referralEarnings.length > 0 ? (
            <div className="space-y-3">
              {referralEarnings.map((earning) => {
                return (
                  <div key={earning.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {earning.referred_name ? earning.referred_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h5 className="font-semibold text-base text-gray-900 dark:text-white">
                                {earning.referred_name || 'Usuário indicado'}
                              </h5>
                              <span className="text-xs text-gray-500">ID: {earning.referred_user_id}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                                ✅ Bônus Recebido
                              </span>
                              <span className="text-xs text-gray-500">
                                📅 {formatDate(earning.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-auto text-left md:text-right space-y-1 md:pl-4">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          + {formatCurrency(earning.amount)}
                        </div>
                        <div className="flex items-center gap-1 justify-start md:justify-end">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-xs text-green-600 dark:text-green-400">Creditado na carteira</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              title="Nenhum bônus por indicação encontrado"
              subtitle="Seus ganhos por indicação aparecerão aqui quando você começar a indicar pessoas"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Indique;