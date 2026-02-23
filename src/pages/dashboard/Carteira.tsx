
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, ArrowUpDown, ArrowDownUp, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { walletApiService } from '@/services/walletApiService';
import PageHeaderCard from '@/components/dashboard/PageHeaderCard';
import WalletInfoCard from '@/components/carteira/WalletInfoCard';
import TransactionHistory from '@/components/carteira/TransactionHistory';
import TransferCard from '@/components/carteira/TransferCard';
import GiftCard from '@/components/carteira/GiftCard';
import { useNavigate } from 'react-router-dom';

const Carteira = () => {
  const { user, isSupport } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState({ saldo: 0, saldo_plano: 0, total: 0 });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load balance from API
  const loadBalance = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [CARTEIRA] Carregando saldo da API...');
      const response = await walletApiService.getTotalBalance(parseInt(user.id));
      
      if (response.success && response.data) {
        console.log('✅ [CARTEIRA] Resposta da API:', response.data);
        
        // Mapear dados da API para o formato esperado
        const balanceData = {
          saldo: Number(response.data.saldo) || 0,
          saldo_plano: Number(response.data.saldo_plano) || 0,
          total: Number(response.data.total) || Number(response.data.total_balance) || 0
        };
        
        console.log('✅ [CARTEIRA] Saldo mapeado:', balanceData);
        setBalance(balanceData);
      } else {
        throw new Error(response.error || 'Erro ao carregar saldo');
      }
    } catch (error) {
      console.error('❌ [CARTEIRA] Erro ao carregar saldo:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
      // Fallback para saldo zerado
      setBalance({ saldo: 0, saldo_plano: 0, total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [user]);

  // Listen for specific balance updates
  useEffect(() => {
    // Evento específico para recargas
    const handleBalanceRecharge = (event: any) => {
      console.log('💰 [CARTEIRA] Recarga detectada');
      if (event.detail?.shouldAnimate) {
        setShouldAnimate(true);
        setTimeout(() => setShouldAnimate(false), 2000);
      }
      loadBalance();
    };

    // Evento específico para compras de planos
    const handlePlanPurchase = (event: any) => {
      console.log('💎 [CARTEIRA] Compra de plano detectada');
      if (event.detail?.shouldAnimate) {
        setShouldAnimate(true);
        setTimeout(() => setShouldAnimate(false), 2000);
      }
      loadBalance();
    };

    // Manter compatibilidade com evento genérico
    const handleBalanceUpdate = (event: any) => {
      if (event.detail?.shouldAnimate) {
        setShouldAnimate(true);
        setTimeout(() => setShouldAnimate(false), 2000);
      }
      loadBalance();
    };

    window.addEventListener('balanceRechargeUpdated', handleBalanceRecharge);
    window.addEventListener('planPurchaseUpdated', handlePlanPurchase);
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceRechargeUpdated', handleBalanceRecharge);
      window.removeEventListener('planPurchaseUpdated', handlePlanPurchase);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, [user]);

  const currentPlan = user ? localStorage.getItem(`user_plan_${user.id}`) || "Pré-Pago" : "Pré-Pago";

  const formatBrazilianCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleTransferRequest = async (recipientId: string, amount: number) => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate transfer logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Trigger balance update event específico para recarga
      window.dispatchEvent(new CustomEvent('balanceRechargeUpdated', { 
        detail: { shouldAnimate: true, amount: amount, method: 'manual' }
      }));
      
      toast.success(`Transferência de ${formatBrazilianCurrency(amount)} realizada com sucesso!`);
    } catch (error) {
      toast.error("Erro ao realizar transferência");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGiftRequest = async (recipientId: string, amount: number) => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate gift logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Trigger balance update event específico para transferência
      window.dispatchEvent(new CustomEvent('balanceRechargeUpdated', { 
        detail: { shouldAnimate: true, amount: amount, method: 'transfer' }
      }));
      
      toast.success(`Gift Card de ${formatBrazilianCurrency(amount)} enviado com sucesso!`);
    } catch (error) {
      toast.error("Erro ao enviar Gift Card");
    } finally {
      setIsProcessing(false);
    }
  };

  // Verificar se o usuário tem permissão para ver Transfer e Gift Cards
  const canUseTransferAndGift = isSupport || user?.user_role !== 'assinante';

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-1 sm:px-0">
      {/* Header */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                <span className="truncate">Carteira Digital</span>
                {error && (
                  <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded dark:bg-red-900 dark:text-red-300 flex-shrink-0">
                    Erro
                  </span>
                )}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                {error ? 'Dados podem estar desatualizados' : 'Dados sincronizados com a API externa'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Badge variant="secondary" className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${error ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"}`}>
                {error ? 'Erro' : 'Ativa'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadBalance}
                disabled={isLoading}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
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

      {canUseTransferAndGift ? (
        <>
          {/* Layout para usuários com permissão (suporte/admin) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <WalletInfoCard 
              userBalance={balance.total}
              currentPlan={currentPlan}
              formatBrazilianCurrency={formatBrazilianCurrency}
              detailedBalance={balance}
              isLoading={isLoading}
            />
            <TransferCard 
              userBalance={balance.total}
              onTransferRequest={handleTransferRequest}
              isProcessing={isProcessing}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <GiftCard 
              userBalance={balance.total}
              onGiftRequest={handleGiftRequest}
              isProcessing={isProcessing}
              formatBrazilianCurrency={formatBrazilianCurrency}
            />
            <TransactionHistory 
              formatBrazilianCurrency={formatBrazilianCurrency}
              useApiData={true}
            />
          </div>
        </>
      ) : (
        <>
          {/* Layout para assinantes - coluna completa para informações da carteira */}
          <div className="space-y-6">
            <WalletInfoCard 
              userBalance={balance.total}
              currentPlan={currentPlan}
              formatBrazilianCurrency={formatBrazilianCurrency}
              detailedBalance={balance}
              isLoading={isLoading}
            />
            <TransactionHistory 
              formatBrazilianCurrency={formatBrazilianCurrency}
              useApiData={true}
            />
          </div>
        </>
      )}

    </div>
  );
};

export default Carteira;
