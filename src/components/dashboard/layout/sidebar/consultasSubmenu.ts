
import { Search, User, Building2, Car, Users, Clipboard } from 'lucide-react';
import { SidebarItem } from '../types';

export const createConsultasSubmenu = (): SidebarItem => ({
  icon: Search,
  label: 'Consultas',
  path: '#',
  // Removido o moduleCount para que não apareça contador nas consultas
  subItems: [
    {
      icon: User,
      label: 'Consultar CPF PUXA TUDO',
      path: '/dashboard/consultar-cpf-puxa-tudo'
    },
    {
      icon: Building2,
      label: 'Consultar CNPJ',
      path: '/dashboard/consultar-cnpj'
    },
    {
      icon: Car,
      label: 'Consultar Veículo',
      path: '/dashboard/consultar-veiculo'
    },
    {
      icon: User,
      label: 'Busca Nome',
      path: '/dashboard/busca-nome'
    },
    {
      icon: Users,
      label: 'Busca Mãe',
      path: '/dashboard/busca-mae'
    },
    {
      icon: Users,
      label: 'Busca Pai',
      path: '/dashboard/busca-pai'
    },
    {
      icon: Clipboard,
      label: 'Checker Lista',
      path: '/dashboard/checker-lista'
    }
  ]
});
