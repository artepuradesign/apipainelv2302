
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, RefreshCw, Wifi, WifiOff, ArrowLeft } from 'lucide-react';

import AllHistorySection from '@/components/historico/sections/AllHistorySection';
import ConsultationsSection from '@/components/historico/sections/ConsultationsSection';
import RechargesSection from '@/components/historico/sections/RechargesSection';
import ReferralsSection from '@/components/historico/sections/ReferralsSection';
import CouponsSection from '@/components/historico/sections/CouponsSection';
import PurchasesSection from '@/components/historico/sections/PurchasesSection';
import PixPaymentsSection from '@/components/dashboard/PixPaymentsSection';
import { useAuth } from '@/contexts/AuthContext';
import { walletApiService } from '@/services/walletApiService';
import { cupomApiService } from '@/services/cupomApiService';
import { consultationApiService } from '@/services/consultationApiService';
import {
  formatBrazilianCurrency,
  formatDate,
  filterTransactions,
  getRechargeTransactions
} from '@/utils/historicoUtils';
import { useNavigate } from 'react-router-dom';

// Estado simplificado e otimizado
interface HistoricoState {
  allHistory: any[];
  transactions: any[];
  referralEarnings: any[];
  consultations: any[];
  cupomHistory: any[];
  loading: boolean;
  error: string | null;
}

const Historico = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<HistoricoState>({
    allHistory: [],
    transactions: [],
    referralEarnings: [],
    consultations: [],
    cupomHistory: [],
    loading: false,
    error: null
  });
  

  // Função para carregar dados de forma otimizada
  const loadHistoryData = async () => {
    if (!user) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔄 [HISTORICO] Carregando dados da API...');
      
      // Carregar dados em paralelo
      const [transactionsResponse, cupomResponse, consultasResponse] = await Promise.allSettled([
        walletApiService.getTransactionHistory(parseInt(user.id), 100),
        cupomApiService.getCupomHistory(parseInt(user.id)),
        consultationApiService.getConsultationHistory(100, 0)
      ]);

      let allHistoryData: any[] = [];
      let apiTransactions: any[] = [];
      let apiReferrals: any[] = [];
      let apiCupons: any[] = [];
      let apiConsultations: any[] = [];

      // Processar transações
      if (transactionsResponse.status === 'fulfilled' && transactionsResponse.value.success) {
        const transactionData = transactionsResponse.value.data;
        
        apiTransactions = transactionData.map((t: any) => ({
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
                   ? 'bonus' : 'normal',
          is_referral: t.type === 'indicacao' || 
                      (t.description && (
                        t.description.includes('Bônus') || 
                        t.description.includes('indicação') ||
                        t.description.includes('boas-vindas') ||
                        t.description.includes('welcome')
                      ))
        }));
        
        // Extrair indicações
        apiReferrals = transactionData
          .filter((t: any) => t.type === 'indicacao')
          .map((t: any) => {
            const match = t.description.match(/- (.*?) se cadastrou/);
            const referredName = match ? match[1] : `Usuário ${t.reference_id || 'N/A'}`;
            
            return {
              id: t.id?.toString() || Date.now().toString(),
              referrer_id: user.id,
              referred_user_id: t.reference_id || t.id,
              amount: parseFloat(t.amount) || 0,
              created_at: t.created_at || new Date().toISOString(),
              status: 'paid',
              referred_name: referredName
            };
          });
        
        // Filtrar para histórico completo
        const filteredForAll = apiTransactions.filter(t => 
          t.type !== 'consulta' && !(t.type === 'bonus' && t.description && t.description.includes('Cupom'))
        );
        allHistoryData = [...filteredForAll];
      }

      // Processar cupons
      if (cupomResponse.status === 'fulfilled' && cupomResponse.value.success) {
        apiCupons = cupomResponse.value.data.map((cupom: any) => ({
          ...cupom,
          category: 'cupom'
        }));
        allHistoryData = [...allHistoryData, ...apiCupons];
      }

      // Processar consultas
      if (consultasResponse.status === 'fulfilled' && consultasResponse.value.success) {
        const userConsultas = consultasResponse.value.data.filter((consulta: any) => 
          consulta.user_id === parseInt(user.id)
        );
        
        apiConsultations = userConsultas.map((consulta: any) => {
          const valorCobrado = parseFloat(consulta.cost || 0);

          return {
            id: `CPF-${consulta.id}`,
            type: 'consultation',
            module_type: 'cpf',
            document: consulta.document || 'CPF consultado',
            cost: valorCobrado,
            amount: -Math.abs(valorCobrado),
            saldo_usado: 'carteira',
            status: 'success',
            created_at: consulta.created_at,
            updated_at: consulta.created_at,
            category: 'consultation',
            source_table: 'consultas_history',
            balance_type: 'wallet',
            description: `Consulta CPF ${consulta.document ? consulta.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''}`,
            result_data: consulta.result_data
          };
        });
        
        allHistoryData = [...allHistoryData, ...apiConsultations];
      }
      
      // Ordenar por data
      allHistoryData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setState(prev => ({
        ...prev,
        transactions: apiTransactions,
        referralEarnings: apiReferrals,
        cupomHistory: apiCupons,
        consultations: apiConsultations,
        allHistory: allHistoryData,
        loading: false,
        error: null
      }));
      
      console.log('✅ [HISTORICO] Dados carregados:', allHistoryData.length);
      
    } catch (error) {
      console.error('❌ [HISTORICO] Erro ao carregar dados:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados',
        loading: false
      }));
      
      // Fallback para dados locais
      loadLocalData();
    }
  };

  // Fallback para dados locais
  const loadLocalData = () => {
    if (!user) return;
    
    try {
      const localTransactions = JSON.parse(localStorage.getItem(`balance_transactions_${user.id}`) || '[]');
      setState(prev => ({
        ...prev,
        transactions: localTransactions,
        allHistory: localTransactions,
        referralEarnings: [],
        cupomHistory: [],
        consultations: []
      }));
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error);
    }
  };

  // Função para atualizar dados
  const refreshData = () => {
    loadHistoryData();
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadHistoryData();
  }, [user]);

  // Computar valores derivados
  const filteredTransactions = filterTransactions(state.transactions, '');
  const rechargeTransactions = getRechargeTransactions(filteredTransactions);

  return (
    <div className="space-y-3 sm:space-y-6 relative z-10 px-1 sm:px-0">
      {/* Header */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                <span className="truncate">Histórico Completo</span>
                {state.error ? (
                  <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                )}
              </CardTitle>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                disabled={state.loading}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${state.loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full h-9 w-9"
                aria-label="Voltar"
                title="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>


      {/* Seções Independentes */}
      <div className="space-y-3 sm:space-y-6">
        {/* Seção: Consultas */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground px-1">Consultas Realizadas</h2>
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <ConsultationsSection
                allHistory={state.allHistory}
                formatBrazilianCurrency={formatBrazilianCurrency}
                formatDate={formatDate}
                loading={state.loading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Seção: Pagamentos PIX */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground px-1">Pagamentos PIX</h2>
          <PixPaymentsSection />
        </div>

        {/* Seção: Recargas */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground px-1">Recargas e Depósitos</h2>
          <RechargesSection
            rechargeTransactions={rechargeTransactions}
            formatBrazilianCurrency={formatBrazilianCurrency}
            formatDate={formatDate}
            loading={state.loading}
          />
        </div>

        {/* Seção: Compras */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground px-1">Compras e Planos</h2>
          <PurchasesSection
            allHistory={state.allHistory}
            formatBrazilianCurrency={formatBrazilianCurrency}
            formatDate={formatDate}
            loading={state.loading}
          />
        </div>

        {/* Seção: Indicações */}
        {state.referralEarnings.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground px-1">Ganhos com Indicações</h2>
            <ReferralsSection
              referralEarnings={state.referralEarnings}
              formatBrazilianCurrency={formatBrazilianCurrency}
              formatDate={formatDate}
              loading={state.loading}
            />
          </div>
        )}

        {/* Seção: Cupons */}
        {state.cupomHistory.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground px-1">Cupons Utilizados</h2>
            <CouponsSection
              cupomHistory={state.cupomHistory}
              formatBrazilianCurrency={formatBrazilianCurrency}
              formatDate={formatDate}
              loading={state.loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Historico;
