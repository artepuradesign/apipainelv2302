import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleCounter } from '@/components/ui/simple-counter';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Gift, 
  UserCheck,
  QrCode,
  Ticket,
  Settings,
  Grid3X3,
  UserPlus
} from 'lucide-react';
import { type DashboardStats } from '@/hooks/useApiDashboardAdmin';

interface UnifiedAdminStatsCardsProps {
  dashboardStats: DashboardStats | null;
}

const UnifiedAdminStatsCards: React.FC<UnifiedAdminStatsCardsProps> = ({ dashboardStats }) => {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };
  if (!dashboardStats) {
    return (
      <div className="space-y-4">
        {/* Linha 1 - Financeiro Principal */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
           {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Carregando...
                </CardTitle>
                <div className="h-6 w-6 lg:h-8 lg:w-8 bg-muted rounded"></div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-6 lg:h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Linha 2 - Métodos de Pagamento */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
           {[...Array(2)].map((_, i) => (
            <Card key={i + 4} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Carregando...
                </CardTitle>
                <div className="h-6 w-6 lg:h-8 lg:w-8 bg-muted rounded"></div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-6 lg:h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Linha 3 - Sistema e Usuários */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i + 8} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Carregando...
                </CardTitle>
                <div className="h-6 w-6 lg:h-8 lg:w-8 bg-muted rounded"></div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-6 lg:h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Linha 1 - Financeiro Principal
  const financialData = [
    {
      title: "Saldo em Caixa",
      rawValue: dashboardStats.cash_balance,
      isCurrency: true,
      icon: DollarSign,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      description: "Saldo total do caixa central",
      path: "/dashboard/admin/caixa"
    },
    {
      title: "Compra de Planos",
      rawValue: dashboardStats.plan_sales || 0,
      isCurrency: true,
      icon: CreditCard,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      description: "Valor total das compras de planos",
      path: "/dashboard/admin/compra-planos"
    },
    {
      title: "Total em Recargas",
      rawValue: dashboardStats.total_recharges,
      isCurrency: true,
      icon: TrendingUp,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "Total recebido em recargas",
      path: "/dashboard/admin/recargas"
    },
    {
      title: "Total de Indicações",
      rawValue: dashboardStats.total_referrals,
      displayValue: `${dashboardStats.total_referrals} / ${formatCurrency(dashboardStats.total_commissions)}`,
      isCurrency: false,
      icon: Gift,
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
      description: "Quantidade / Valor pago",
      path: "/dashboard/admin/indicacoes"
    }
  ];

  // Linha 2 - Métodos de Pagamento
  const paymentData = [
    {
      title: "Pagamento PIX",
      rawValue: dashboardStats.payment_pix || 0,
      isCurrency: true,
      icon: QrCode,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      description: "Transações instantâneas PIX",
      path: "/dashboard/admin/pagamentos-pix"
    },
    {
      title: "Cartão de Crédito",
      rawValue: dashboardStats.payment_card || 0,
      isCurrency: true,
      icon: CreditCard,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "Pagamentos processados via cartão",
      path: "/dashboard/admin/pagamentos-cartao"
    },
    {
      title: "PayPal",
      rawValue: dashboardStats.payment_paypal || 0,
      isCurrency: true,
      icon: DollarSign,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      description: "Pagamentos internacionais",
      path: "/dashboard/admin/pagamentos-paypal"
    },
    {
      title: "Total Cupom Usados",
      rawValue: dashboardStats.total_coupons_used || 0,
      isCurrency: true,
      icon: Ticket,
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      description: "Cupons de desconto utilizados",
      path: "/dashboard/admin/cupons"
    }
  ];

  // Linha 3 - Sistema e Usuários
  const systemData = [
    {
      title: "Painéis Ativos",
      rawValue: dashboardStats.active_plans || 0,
      isCurrency: false,
      icon: Settings,
      bgColor: "bg-cyan-500/10",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      description: "Painéis atualmente ativos",
      path: "/dashboard/admin/paineis-ativos"
    },
    {
      title: "Módulos Total",
      rawValue: dashboardStats.total_modules || 0,
      isCurrency: false,
      icon: Grid3X3,
      bgColor: "bg-indigo-500/10",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      description: "Módulos disponíveis no sistema",
      path: "/dashboard/admin/modulos"
    },
    {
      title: "Usuários Ativos",
      rawValue: dashboardStats.users_online || 0,
      isCurrency: false,
      icon: UserCheck,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      description: "Usuários ativos nos últimos 5 min",
      path: "/dashboard/admin/usuarios-online"
    },
    {
      title: "Total de Usuários",
      rawValue: dashboardStats.total_users,
      isCurrency: false,
      icon: Users,
      bgColor: "bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      description: "Usuários registrados",
      path: "/dashboard/gestao-usuarios"
    }
  ];

  const renderCardRow = (data: typeof financialData, title?: string) => (
    <div className="space-y-2">
      {title && <h3 className="text-lg font-semibold dashboard-text-primary">{title}</h3>}
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        {data.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="dashboard-card hover:shadow-lg transition-all duration-300 min-h-[120px] lg:min-h-[140px]"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium dashboard-text-primary line-clamp-2 leading-tight">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 lg:p-2 ${stat.bgColor} rounded-lg flex-shrink-0`}>
                  <Icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-1 lg:pt-2">
                <div className="text-lg lg:text-2xl font-bold dashboard-text-primary mb-1 line-clamp-1">
                  <SimpleCounter 
                    value={stat.rawValue} 
                    className="inline"
                    duration={5000}
                    formatAsCurrency={stat.isCurrency}
                  />
                </div>
                <p className="text-xs dashboard-text-muted leading-tight line-clamp-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {financialData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="dashboard-card hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-h-[120px] lg:min-h-[140px] group"
              onClick={() => handleCardClick(stat.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium dashboard-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 lg:p-2 ${stat.bgColor} rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-1 lg:pt-2">
                <div className="text-lg lg:text-2xl font-bold dashboard-text-primary mb-1 line-clamp-1">
                  {stat.displayValue || (
                    <SimpleCounter 
                      value={stat.rawValue} 
                      className="inline"
                      duration={5000}
                      formatAsCurrency={stat.isCurrency}
                    />
                  )}
                </div>
                <p className="text-xs dashboard-text-muted leading-tight line-clamp-2 group-hover:text-foreground/70 transition-colors">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {paymentData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="dashboard-card hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-h-[120px] lg:min-h-[140px] group"
              onClick={() => handleCardClick(stat.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium dashboard-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 lg:p-2 ${stat.bgColor} rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-1 lg:pt-2">
                <div className="text-lg lg:text-2xl font-bold dashboard-text-primary mb-1 line-clamp-1">
                  <SimpleCounter 
                    value={stat.rawValue} 
                    className="inline"
                    duration={5000}
                    formatAsCurrency={stat.isCurrency}
                  />
                </div>
                <p className="text-xs dashboard-text-muted leading-tight line-clamp-2 group-hover:text-foreground/70 transition-colors">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {systemData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="dashboard-card hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] min-h-[120px] lg:min-h-[140px] group"
              onClick={() => handleCardClick(stat.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium dashboard-text-primary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 lg:p-2 ${stat.bgColor} rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-1 lg:pt-2">
                <div className="text-lg lg:text-2xl font-bold dashboard-text-primary mb-1 line-clamp-1">
                  <SimpleCounter 
                    value={stat.rawValue} 
                    className="inline"
                    duration={5000}
                    formatAsCurrency={stat.isCurrency}
                  />
                </div>
                <p className="text-xs dashboard-text-muted leading-tight line-clamp-2 group-hover:text-foreground/70 transition-colors">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedAdminStatsCards;