import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  type?: string;
  module_type?: string;
  document?: string;
  cost?: number;
  amount?: number;
  status?: string;
  created_at: string;
  result_data?: any;
  [key: string]: any;
}

interface ConsultationsSectionProps {
  allHistory: Array<HistoryItem>;
  formatBrazilianCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  loading?: boolean;
}

const ConsultationsSection: React.FC<ConsultationsSectionProps> = ({
  allHistory,
  formatBrazilianCurrency,
  formatDate,
  loading = false
}) => {
  const navigate = useNavigate();

  const consultationItems = allHistory.filter(item =>
    'type' in item && (item.type === 'consultation' || item.type === 'Consulta CPF')
  );

  const handleConsultationClick = (consultation: any) => {
    if (!consultation.result_data) {
      toast.error('Dados da consulta não disponíveis');
      return;
    }

    const pageRoute = consultation?.metadata?.page_route;
    if (!pageRoute) {
      toast.error('Não foi possível identificar o módulo desta consulta (page_route ausente)');
      return;
    }

    // Redirecionar para página de consulta com os dados no state
    navigate(pageRoute, {
      state: {
        fromHistory: true,
        consultationData: consultation.result_data,
        cpf: consultation.document,
        noCharge: true
      }
    });

    toast.success('Consulta carregada do histórico (sem cobrança)', { duration: 2000 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Carregando consultas...</span>
      </div>
    );
  }

  if (consultationItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma consulta encontrada
        </h3>
        <p className="text-sm">
          Suas consultas realizadas aparecerão aqui
        </p>
      </div>
    );
  }

  const formatCPF = (cpf: string) => {
    if (!cpf || cpf === 'CPF consultado') return 'N/A';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead className="w-32">CPF</TableHead>
              <TableHead className="w-48">Data e Hora</TableHead>
              <TableHead className="w-24 text-right">Valor</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultationItems.map((consultation) => {
              const consultationValue = consultation.cost || consultation.amount || 0;
              const valueString = String(consultationValue);
              const numericValue = typeof consultationValue === 'string' 
                ? parseFloat(valueString.replace(',', '.')) 
                : Math.abs(Number(consultationValue)) || 0;

              return (
                <TableRow 
                  key={consultation.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => handleConsultationClick(consultation)}
                >
                  <TableCell className="font-mono text-xs">
                    {consultation.id.toString().slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCPF(consultation.document || '')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatFullDate(consultation.created_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-red-600 dark:text-red-400">
                    R$ {numericValue.toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={consultation.status === 'success' || consultation.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {consultation.status === 'success' || consultation.status === 'completed' ? 'Concluída' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {consultationItems.map((consultation) => {
          const consultationValue = consultation.cost || consultation.amount || 0;
          const valueString = String(consultationValue);
          const numericValue = typeof consultationValue === 'string' 
            ? parseFloat(valueString.replace(',', '.')) 
            : Math.abs(Number(consultationValue)) || 0;

          const statusIsDone = consultation.status === 'success' || consultation.status === 'completed';
          const moduleLabel = (consultation.module_type || '').toString().trim().toUpperCase();

          return (
            <button
              key={consultation.id}
              type="button"
              onClick={() => handleConsultationClick(consultation)}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {/* Status indicator */}
                <span
                  className={`flex-shrink-0 h-2 w-2 rounded-full ${statusIsDone ? 'bg-primary' : 'bg-muted-foreground'}`}
                  aria-label={statusIsDone ? 'Concluída' : 'Pendente'}
                />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium truncate">
                          {formatCPF(consultation.document || '')}
                        </span>
                        {moduleLabel ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
                          >
                            {moduleLabel}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatFullDate(consultation.created_at)}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-medium text-destructive">
                          {formatBrazilianCurrency(numericValue)}
                        </div>
                      </div>
                      <Badge
                        variant={statusIsDone ? 'default' : 'secondary'}
                        className="text-[10px] h-5 px-2"
                      >
                        {statusIsDone ? 'OK' : '...'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default ConsultationsSection;