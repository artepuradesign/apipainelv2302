import React, { useState, useRef } from 'react';
import { useExternalPlans } from '@/hooks/useExternalPlans';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw, Crown, Check, Mail, CreditCard, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useAuth } from '@/contexts/AuthContext';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { planPurchaseService } from '@/services/planPurchaseService';

const CarouselWithControls = ({ categoryPlans, categoryName, PlanCard }: any) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [api, setApi] = useState<any>(null);

  // Create autoplay plugin
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  // Handle play/pause - only after API is ready
  React.useEffect(() => {
    if (!api) return;
    
    const autoplay = autoplayPlugin.current;
    if (!autoplay) return;
    
    // Adicionar delay para garantir que o embla está completamente inicializado
    const timer = setTimeout(() => {
      try {
        if (isPlaying && !isHovered) {
          autoplay.play();
        } else {
          autoplay.stop();
        }
      } catch (error) {
        console.error('Error controlling autoplay:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [api, isPlaying, isHovered]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Carousel 
        className="w-full"
        plugins={[autoplayPlugin.current as any]}
        opts={{
          align: "start",
          loop: true,
          slidesToScroll: 1,
        }}
        setApi={setApi}
      >
        <CarouselContent className="overflow-visible py-4 -ml-4">
          {categoryPlans.map((plan: any, index: number) => (
            <CarouselItem 
              key={plan.id} 
              className="pl-4 basis-[85%] sm:basis-1/3 lg:basis-1/4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <PlanCard plan={plan} categoryName={categoryName} />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Controladores do carrossel com play/pause */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <CarouselPrevious className="relative translate-y-0 left-0" />
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/90 shadow-lg hover:bg-white hover:shadow-xl border border-gray-200/50 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:border-gray-700/50 transition-all duration-300"
            onClick={togglePlayPause}
          >
            {isPlaying && !isHovered ? (
              <Pause className="h-5 w-5 text-brand-purple dark:text-brand-purple" />
            ) : (
              <Play className="h-5 w-5 text-brand-purple dark:text-brand-purple" />
            )}
          </Button>
          
          <CarouselNext className="relative translate-y-0 right-0" />
        </div>
      </Carousel>
    </div>
  );
};

const PublicPlansSection = () => {
  const { plans: externalPlans, isLoading, error, refetchPlans } = useExternalPlans();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useWalletBalance();

  const handlePlanSelection = (plan: any) => {
    // Redirecionar diretamente para a página de pagamento público
    navigate(`/public-plan-payment?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}`);
  };

  const handleUpgradePlan = async (plan: any) => {
    try {
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const planPrice = parseFloat(plan.price) || 0;
      const userWalletBalance = balance?.saldo || 0;

      if (userWalletBalance < planPrice) {
        toast.error(`Saldo insuficiente. Necessário: R$ ${planPrice.toFixed(2)}, Disponível: R$ ${userWalletBalance.toFixed(2)}`);
        return;
      }

      // Confirmação da compra
      const confirmed = window.confirm(
        `Confirma a compra do plano ${plan.name} por R$ ${planPrice.toFixed(2)}?\n\n` +
        `Seu saldo atual: R$ ${userWalletBalance.toFixed(2)}\n` +
        `Saldo após compra: R$ ${(userWalletBalance - planPrice).toFixed(2)}`
      );

      if (!confirmed) return;

      const loadingToast = toast.loading('Processando compra do plano...');

      const purchaseData = {
        plan_id: plan.id,
        payment_method: 'wallet',
        amount: planPrice,
        description: `Compra do plano ${plan.name} via saldo da carteira`
      };

      const response = await planPurchaseService.purchasePlan(purchaseData);

      // Remover o toast de loading
      toast.dismiss(loadingToast);

      if (response.success) {
        // Toast único consolidado já é exibido pelo showPlanPurchaseToast no planPurchaseService
        
        // Recarregar saldo do usuário e atualizar seção de planos
        window.dispatchEvent(new Event('balanceUpdated'));
        window.dispatchEvent(new CustomEvent('planBalanceUpdated', { 
          detail: { 
            amount: planPrice,
            planName: plan.name 
          } 
        }));
      } else {
        throw new Error(response.error || 'Erro ao processar compra');
      }
    } catch (error) {
      console.error('Erro ao fazer upgrade do plano:', error);
      let errorMessage = 'Erro ao processar upgrade do plano';
      
      if (error instanceof Error) {
        // Tratar erros específicos da API
        if (error.message.includes('SQLSTATE[HY093]')) {
          errorMessage = 'Sistema temporariamente indisponível. Tente novamente em alguns minutos ou entre em contato com o suporte.';
        } else if (error.message.includes('Invalid parameter number')) {
          errorMessage = 'Erro interno do sistema. Nossa equipe técnica foi notificada. Tente novamente mais tarde.';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Garantir que o toast de loading seja removido em caso de erro
      toast.dismiss();
      toast.error(errorMessage, {
        duration: 8000, // Manter o erro visível por mais tempo
        action: {
          label: 'Tentar Novamente',
          onClick: () => handleUpgradePlan(plan)
        }
      });
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const u = user as any;
  const currentPlanId = u?.subscription?.plan_id;
  const currentPlanName = u?.subscription?.plan_name || u?.plan;

  const isCurrentPlan = (plan: any) => {
    if (!user) return false;

    if (currentPlanId != null && String(plan?.id) === String(currentPlanId)) return true;
    if (currentPlanName && String(plan?.name || '').toLowerCase() === String(currentPlanName).toLowerCase()) return true;

    return false;
  };

  // Agrupar planos por categoria
  const groupedPlans = externalPlans.reduce((acc, plan) => {
    const category = plan.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(plan);
    return acc;
  }, {} as Record<string, typeof externalPlans>);

  // Ordenar planos dentro de cada categoria (plano atual primeiro, depois sort_order)
  Object.keys(groupedPlans).forEach(category => {
    groupedPlans[category].sort((a, b) => {
      const aCurrent = isCurrentPlan(a) ? 1 : 0;
      const bCurrent = isCurrentPlan(b) ? 1 : 0;
      return bCurrent - aCurrent || (a.sort_order || 0) - (b.sort_order || 0);
    });
  });

  const PlanCard = ({ plan, categoryName }: { plan: any, categoryName: string }) => {
    const features = Array.isArray(plan.features) ? plan.features : [];
    const planPrice = parseFloat(plan.price) || 0;
    const userWalletBalance = balance?.saldo || 0;
    const hasSufficientBalance = user && userWalletBalance >= planPrice;
    const isCurrent = isCurrentPlan(plan);

    // Exibir um número fixo de módulos para manter altura padrão dos cards
    const MAX_VISIBLE_FEATURES = 8;
    const visibleFeatures = features.slice(0, MAX_VISIBLE_FEATURES);
    const remainingFeatures = Math.max(0, features.length - MAX_VISIBLE_FEATURES);

    return (
      <div className="w-full max-w-[240px] mx-auto">
        <Card
          className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300 group ${
            isCurrent ? 'ring-2 ring-primary shadow-lg' : ''
          } ${
            plan.is_popular ? 'ring-1 ring-purple-400/40 dark:ring-purple-500/40' : ''
          }`}
        >
          <CardContent className="p-4 flex flex-col">
            {/* Badge plano atual */}
            {isCurrent && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="text-[10px] px-2 py-0.5">PLANO ATUAL</Badge>
              </div>
            )}

            {/* Badge popular */}
            {plan.is_popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                  {plan.badge || 'Popular'}
                </span>
              </div>
            )}

            {/* Header compacto */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">
                  {plan.name}
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs rounded">
                  {plan.duration_days} dias
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {plan.priceFormatted || formatCurrency(plan.price)}
                </div>
                {plan.discount_percentage > 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    -{plan.discount_percentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Descrição curta */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
              {plan.description}
            </p>

            {/* Features compactas */}
            <div className="space-y-1.5 mb-4">
              {visibleFeatures.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <Check className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feature}</span>
                </div>
              ))}
              {remainingFeatures > 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  +{remainingFeatures} mais
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="space-y-1.5">
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                onClick={() => handlePlanSelection(plan)}
              >
                Adquirir
              </Button>

              {user && hasSufficientBalance && (
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  onClick={() => handleUpgradePlan(plan)}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>

            {user && !hasSufficientBalance && (
              <div className="mt-2 text-center">
                <p className="text-xs text-red-500 mb-1">
                  +R$ {(planPrice - userWalletBalance).toFixed(2)} para Upgrade
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-green-600 hover:text-green-700 h-6 px-2"
                  onClick={() =>
                    navigate(
                      `/dashboard/adicionar-saldo?valor=${(planPrice - userWalletBalance).toFixed(2)}`
                    )
                  }
                >
                  Adicionar Saldo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <section className="py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Planos Disponíveis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Carregando planos...
            </p>
          </div>
          
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-purple mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Planos Disponíveis
            </h2>
          </div>
          
          <div className="flex justify-center items-center py-6">
            <div className="w-full max-w-md">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-destructive/20 shadow-lg">
                <CardContent className="p-5 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-destructive/10 dark:bg-destructive/20 rounded-full">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Erro de Carregamento
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Não foi possível carregar os planos
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={refetchPlans}
                      className="bg-destructive hover:bg-destructive/90 text-white text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Tentar Novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (externalPlans.length === 0) {
    return (
      <section className="py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Planos Disponíveis
            </h2>
          </div>
          
          <div className="flex justify-center items-center py-6">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Ainda não temos planos cadastrados
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Em breve teremos novos planos.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-10 relative overflow-hidden">
      {/* Background gradiente sutil (mesma linguagem do Depoimentos) */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10" />

      {/* Elementos decorativos */}
      <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-brand-purple/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <div className="space-y-6">
          {Object.entries(groupedPlans).map(([categoryName, categoryPlans], categoryIndex) => {
            return (
              <motion.div
                key={categoryName}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                className="w-full"
              >
                <div className="w-full">
                  {/* Header compacto da categoria */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Planos {categoryName}
                    </h3>
                    <span className="flex items-center justify-center w-5 h-5 bg-purple-600 text-white rounded-full text-[10px] font-bold">
                      {categoryPlans.length}
                    </span>
                  </div>

                  <CarouselWithControls
                    categoryPlans={categoryPlans}
                    categoryName={categoryName}
                    PlanCard={PlanCard}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PublicPlansSection;