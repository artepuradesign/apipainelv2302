
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Panel } from '@/utils/apiService';
import { useApiModules } from '@/hooks/useApiModules';
import { useUserBalance } from '@/hooks/useUserBalance';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleTemplate } from '@/contexts/ModuleTemplateContext';
import * as Icons from 'lucide-react';
import { Package, Lock } from 'lucide-react';
import EmptyState from '../ui/empty-state';
import ModuleCardTemplates from '@/components/configuracoes/personalization/ModuleCardTemplates';
import ModuleGridWrapper from '@/components/configuracoes/personalization/ModuleGridWrapper';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { useModuleRecords } from '@/hooks/useModuleRecords';

interface PanelsGridProps {
  activePanels: Panel[];
}

const PanelsGrid: React.FC<PanelsGridProps> = ({ activePanels }) => {
  const { modules } = useApiModules();
  const { 
    calculateDiscountedPrice, 
    subscription, 
    planInfo, 
    discountPercentage, 
    hasActiveSubscription 
  } = useUserSubscription();
  const { totalAvailableBalance, isLoading: isBalanceLoading, hasLoadedOnce, loadTotalAvailableBalance } = useUserBalance();
  const { user } = useAuth();
  const canConfigureModules = (user as any)?.user_role === 'suporte' || (user as any)?.user_role === 'admin';
  const { selectedTemplate } = useModuleTemplate();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasRecordsInModule } = useModuleRecords();
  
  // Obter plano atual (subscription > planInfo > fallback em localStorage)
  // Importante: parênteses para evitar precedência incorreta entre `||` e ternário.
  const currentPlan =
    subscription?.plan_name ||
    planInfo?.name ||
    (user ? localStorage.getItem(`user_plan_${user.id}`) || 'Pré-Pago' : 'Pré-Pago');

  // Desconto efetivo deve vir do plano configurado (discount_percentage) / assinatura.
  // Sem fallback local, para refletir exatamente a configuração da Personalização.
  // (o painel 38 é tratado como exceção mais abaixo, tanto na exibição quanto no clique)
  const effectiveDiscountPercentage = hasActiveSubscription ? (discountPercentage || 0) : 0;
  
  console.log('🔍 [PANELSGRID] Dados do plano da API:', {
    hasActiveSubscription,
    subscriptionPlan: subscription?.plan_name,
    planInfoName: planInfo?.name,
    discountPercentageFromAPI: discountPercentage,
    currentPlan,
    effectiveDiscountPercentage
  });
  
  const getIconComponent = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
    return IconComponent || Package;
  };

  const getPanelModules = (panelId: number) => {
    return modules.filter(module => 
      module.panel_id === panelId && 
      module.is_active === true && 
      module.operational_status === 'on'
    );
  };

  const getPanelTemplate = (panelId: number): 'corporate' | 'creative' | 'minimal' | 'modern' | 'elegant' | 'forest' | 'rose' | 'cosmic' | 'neon' | 'sunset' | 'arctic' | 'volcano' | 'matrix' => {
    const validTemplates = ['corporate', 'creative', 'minimal', 'modern', 'elegant', 'forest', 'rose', 'cosmic', 'neon', 'sunset', 'arctic', 'volcano', 'matrix'];
    const panel = activePanels.find(p => p.id === panelId);
    
    // PRIORIDADE ABSOLUTA: template específico do painel (configurado na personalização)
    if (panel?.template && validTemplates.includes(panel.template)) {
      const template = panel.template as 'corporate' | 'creative' | 'minimal' | 'modern' | 'elegant' | 'forest' | 'rose' | 'cosmic' | 'neon' | 'sunset' | 'arctic' | 'volcano' | 'matrix';
      console.log(`🎨 [TEMPLATE DASHBOARD] ✅ Painel ${panelId} (${panel.name}) usando template CONFIGURADO: ${template}`);
      return template;
    }
    
    // Fallback para 'modern' se não há template específico
    console.log(`⚠️ [TEMPLATE DASHBOARD] Painel ${panelId} sem template específico, usando fallback: modern (template do painel: ${panel?.template})`);
    return 'modern';
  };

  const formatPrice = (price: number | string) => {
    if (!price && price !== 0) return '0,00';
    
    if (typeof price === 'string') {
      const cleanPrice = price.replace(/[^\d,\.]/g, '');
      if (!cleanPrice) return '0,00';
      
      if (cleanPrice.includes(',')) {
        const parts = cleanPrice.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          return cleanPrice;
        }
      }
      
      const numericValue = parseFloat(cleanPrice.replace(',', '.'));
      if (isNaN(numericValue)) return '0,00';
      
      return numericValue.toFixed(2).replace('.', ',');
    }
    
    const numericValue = typeof price === 'number' ? price : 0;
    return numericValue.toFixed(2).replace('.', ',');
  };

  const getModulePageRoute = (module: any): string => {
    // Agora o campo `api_endpoint` representa a rota interna da página do módulo (ex.: /dashboard/consultar-cpf-simples)
    const raw = (module?.api_endpoint || module?.path || '').toString().trim();
    if (!raw) return `/module/${module.slug}`;
    if (raw.startsWith('/')) return raw;
    // Normaliza rotas internas digitadas sem a barra inicial
    if (raw.startsWith('dashboard/')) return `/${raw}`;
    // Se vier apenas o "slug" (ex.: consultar-cpf-simples), assume rota interna em /dashboard/
    if (!raw.includes('/')) return `/dashboard/${raw}`;
    // Fallback legado
    return `/module/${module.slug}`;
  };

  const handleModuleClick = (module: any) => {
    if (isBalanceLoading || !hasLoadedOnce) {
      toast.info('Verificando saldo...', {
        description: 'Aguarde um instante e tente novamente.'
      });
      loadTotalAvailableBalance();
      return;
    }

    if (module.operational_status === 'maintenance') {
      toast.info(`Módulo ${module.title} em manutenção`, {
        description: "Voltará em breve"
      });
      return;
    }

    // Calcular preço - apenas com desconto se houver plano ativo
    const originalPrice = parseFloat(module.price?.toString().replace(',', '.') || '0');

    const shouldApplyDiscountOnClick = effectiveDiscountPercentage > 0 && module.panel_id !== 38;

    // calculateDiscountedPrice do hook usa o desconto atual do usuário (já resolvido pelo hook).
    // Quando não há assinatura ativa, usamos o fallback pelo plano atual (planUtils) para manter consistência no /dashboard.
    const finalPrice = shouldApplyDiscountOnClick
      ? (hasActiveSubscription
          ? calculateDiscountedPrice(originalPrice, module.panel_id).discountedPrice
          : Math.max(originalPrice - (originalPrice * effectiveDiscountPercentage) / 100, 0.01))
      : originalPrice;
    
    const moduleRoute = getModulePageRoute(module);
    const userHasRecords = hasRecordsInModule(moduleRoute);

    if (totalAvailableBalance < finalPrice && !userHasRecords) {
      toast.error(
        `Saldo insuficiente para ${module.title}! Valor necessário: R$ ${finalPrice.toFixed(2)}`,
        {
          action: {
            label: "Adicionar Saldo",
            onClick: () => navigate('/dashboard/adicionar-saldo')
          }
        }
      );
      return;
    }

    navigate(getModulePageRoute(module));
  };


  if (activePanels.length === 0) {
    return (
      <div className="bg-white/75 dark:bg-gray-800/75 rounded-lg border border-gray-200/75 dark:border-gray-700/75 backdrop-blur-sm p-8">
        <EmptyState 
          icon={Package}
          title="Nenhum painel ativo"
          description="Configure painéis na seção de Personalização para começar a usar o sistema."
          className="justify-center"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activePanels.map((panel) => {
        const PanelIcon = getIconComponent(panel.icon);
        const panelModules = getPanelModules(panel.id);
        const template = getPanelTemplate(panel.id);
        
        return (
          <div key={panel.id} className="bg-white/75 dark:bg-gray-800/75 rounded-lg border border-gray-200/75 dark:border-gray-700/75 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <PanelIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className={isMobile ? 'text-base' : ''}>{panel.name}</CardTitle>
                    <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold">
                      {panelModules.length}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {panelModules.length > 0 ? (
              <ModuleGridWrapper className={isMobile ? 'py-1 px-2 pb-3' : 'p-6 pt-0 pb-4'}>
                 {panelModules.map((module) => {
                   // Calcular preços - apenas com desconto se houver plano ativo da API
                   // Painel 38 não deve mostrar desconto
                  const originalPrice = parseFloat(module.price?.toString().replace(',', '.') || '0');
                   const shouldShowDiscount = effectiveDiscountPercentage > 0 && module.panel_id !== 38;

                   const finalDiscountedPrice = shouldShowDiscount
                     ? (hasActiveSubscription
                         ? calculateDiscountedPrice(originalPrice, module.panel_id).discountedPrice
                         : Math.max(originalPrice - (originalPrice * effectiveDiscountPercentage) / 100, 0.01))
                     : originalPrice;
                  
                  console.log('🔍 Debug PanelsGrid - Dados do módulo:', {
                    moduleName: module.title,
                    originalPrice,
                    finalPrice: finalDiscountedPrice,
                    hasActiveSubscription,
                    shouldShowDiscount,
                    discountPercentageFromAPI: discountPercentage,
                     effectiveDiscountPercentage,
                    currentPlan,
                    formatPrice: formatPrice(finalDiscountedPrice),
                    willShowOriginalPrice: shouldShowDiscount ? formatPrice(originalPrice) : undefined,
                     willShowDiscountPercentage: shouldShowDiscount ? effectiveDiscountPercentage : undefined
                  });
                  
                  const moduleRoute = getModulePageRoute(module);
                  const userHasRecordsInThis = hasRecordsInModule(moduleRoute);

                   return (
                    <div key={module.id} className={`relative cursor-pointer group ${isMobile ? 'mb-0' : ''}`} onClick={() => handleModuleClick(module)}>
                      <ModuleCardTemplates
                        module={{
                          title: module.title,
                          description: module.description,
                          price: formatPrice(finalDiscountedPrice),
                          // No template, o valor original aparece com moeda (ex.: "R$ 3,00")
                          originalPrice: shouldShowDiscount ? `R$ ${formatPrice(originalPrice)}` : undefined,
                          discountPercentage: shouldShowDiscount ? effectiveDiscountPercentage : undefined,
                          status: module.is_active ? 'ativo' : 'inativo',
                          operationalStatus: module.operational_status === 'maintenance' ? 'manutencao' : module.operational_status,
                          iconSize: 'medium',
                          showDescription: true,
                          icon: module.icon,
                          color: module.color
                        }}
                        template={template}
                      />
                      
                      
                      {/* Overlay para saldo insuficiente - não exibir se usuário já tem registros no módulo */}
                      {hasLoadedOnce && !isBalanceLoading && totalAvailableBalance < finalDiscountedPrice && !userHasRecordsInThis && (
                        <div className="absolute inset-0 bg-black/60 dark:bg-black/70 rounded-lg z-50 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="text-center text-white bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-2xl w-[85%] max-w-[170px]">
                            <Lock className="h-6 w-6 mx-auto mb-2 text-white" />
                            <p className="text-sm font-medium">Saldo Insuficiente</p>
                            <p className="text-xs text-white/80">R$ {finalDiscountedPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </ModuleGridWrapper>
            ) : (
              <div className="p-6 pt-0">
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum módulo ativo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Este painel não possui módulos ativos configurados.
                  </p>
                  {canConfigureModules ? (
                    <Link 
                      to="/dashboard/personalizacao"
                      className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    >
                      Configurar módulos →
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PanelsGrid;
