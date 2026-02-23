
import { LayoutDashboard, User, Wallet, History, Mail, MessageCircle, MessageSquare, Sparkles, Gift, Ticket, LogOut, Layers, CreditCard, RefreshCw, Settings, Users, Palette, FileText, Database, UserPlus, Plug, Store } from 'lucide-react';
import { SidebarItem } from '../types';

export const createAssinanteSidebarItems = (handleLogout: () => void, panelMenus: SidebarItem[] = [], isSupport: boolean = false): SidebarItem[] => {
  
  return [
    // Dashboard administrativo apenas para usuários de suporte
    ...(isSupport ? [{
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard/admin'
    }] : []),
    {
      icon: LayoutDashboard,
      label: 'Painel de Controle',
      path: '/dashboard'
    },
    {
      icon: User,
      label: 'Minha Conta',
      path: '#',
      subItems: [
        {
          icon: User,
          label: 'Dados Pessoais',
          path: '/dashboard/dados-pessoais'
        },
        {
          icon: Wallet,
          label: 'Carteira Digital',
          path: '/dashboard/carteira'
        },
        ...(isSupport ? [
          {
            icon: Ticket,
            label: 'Cupons',
            path: '/dashboard/cupons',
            subItems: [
              {
                icon: Ticket,
                label: 'Usar Cupons',
                path: '/dashboard/cupons'
              },
              {
                icon: Gift,
                label: 'Gerenciar Cupons',
                path: '/dashboard/admin/cupons'
              }
            ]
          }
        ] : [
          {
            icon: Ticket,
            label: 'Cupons',
            path: '/dashboard/cupons'
          }
        ]),
        {
          icon: MessageSquare,
          label: 'Suporte',
          path: '/dashboard/suporte'
        },
        {
          icon: History,
          label: 'Histórico',
          path: '/dashboard/historico',
          subItems: [
            {
              icon: History,
              label: 'Visão geral',
              path: '/dashboard/historico'
            },
            {
              icon: History,
              label: 'Consultas',
              path: '/dashboard/historico/consultas'
            },
            {
              icon: FileText,
              label: 'Cadastros na API',
              path: '/dashboard/historico/cadastros-api'
            },
            {
              icon: CreditCard,
              label: 'Pagamentos PIX',
              path: '/dashboard/historico/pagamentos-pix'
            },
            {
              icon: RefreshCw,
              label: 'Recargas e Depósitos',
              path: '/dashboard/historico/recargas-depositos'
            },
            {
              icon: Wallet,
              label: 'Compras e Planos',
              path: '/dashboard/historico/compras-planos'
            },
            {
              icon: Ticket,
              label: 'Cupons Utilizados',
              path: '/dashboard/historico/cupons-utilizados'
            }
          ]
        }
      ]
    },
    // Grupo de Painéis Disponíveis
    {
      icon: Layers,
      label: 'Painéis Disponíveis',
      path: '#',
      subItems: panelMenus
    },
    // Menu de Administração apenas para usuários de suporte
    ...(isSupport ? [{
      icon: Settings,
      label: 'Administração',
      path: '#',
      subItems: [
        {
          icon: Users,
          label: 'Gestão de Usuários',
          path: '/dashboard/gestao-usuarios'
        },
        {
          icon: Palette,
          label: 'Personalização',
          path: '/dashboard/personalizacao'
        },
        {
          icon: FileText,
          label: 'Admin Depoimentos',
          path: '/dashboard/admin-depoimentos'
        },
        {
          icon: Database,
          label: 'Base de CPFs',
          path: '/dashboard/admin/base-cpf'
        },
        {
          icon: Gift,
          label: 'Gerenciar Cupons',
          path: '/dashboard/admin/cupons'
        },
        {
          icon: MessageSquare,
          label: 'Gerenciar Chamados',
          path: '/dashboard/gerenciar-chamados'
        },
        {
          icon: Settings,
          label: 'Autenticações',
          path: '/dashboard/admin/autenticacoes'
        },
      ]
    }] : []),
    // Menu de Integrações apenas para usuários de suporte
    ...(isSupport ? [{
      icon: Plug,
      label: 'Integrações',
      path: '#',
      subItems: [
        {
          icon: CreditCard,
          label: 'Mercado Pago - PIX',
          path: '/dashboard/integracoes/mercado-pago'
        },
        {
          icon: CreditCard,
          label: 'Mercado Pago - Cartão',
          path: '/dashboard/integracoes/mercado-pago-cartao'
        },
        {
          icon: CreditCard,
          label: 'Mercado Pago - Boleto',
          path: '/dashboard/integracoes/mercado-pago-boleto'
        },
      ]
    }] : []),
    {
      icon: Gift,
      label: 'Indicações',
      path: '#',
      subItems: [
        {
          icon: Gift,
          label: 'Indique e Ganhe',
          path: '/dashboard/indique'
        },
        {
          icon: Store,
          label: 'Revenda',
          path: '/dashboard/revenda'
        }
      ]
    },
  ];
};
