import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHistoricoData } from '@/hooks/useHistoricoData';
import ConsultationsSection from '@/components/historico/sections/ConsultationsSection';
import { formatBrazilianCurrency, formatDate } from '@/utils/historicoUtils';

const HistoricoConsultas = () => {
  const navigate = useNavigate();
  const { state, refresh } = useHistoricoData();

  return (
    <div className="space-y-3 sm:space-y-6 relative z-10 px-1 sm:px-0">
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="truncate">Histórico · Consultas</span>
            </CardTitle>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={state.loading}
                className="h-8 w-8 p-0"
                aria-label="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/dashboard/historico')}
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
  );
};

export default HistoricoConsultas;
