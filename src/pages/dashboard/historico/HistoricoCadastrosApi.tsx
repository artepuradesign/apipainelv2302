import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HistoricoCadastrosApi = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 sm:space-y-6 relative z-10 px-1 sm:px-0">
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="truncate">Histórico · Cadastros na API</span>
            </CardTitle>

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
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="text-sm text-muted-foreground">
            Ainda não existe uma fonte de dados configurada para “Cadastros na API”.
            <br />
            Assim que você me disser de onde vem esse histórico (qual endpoint/tabela/evento), eu conecto aqui e exibo os detalhes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoCadastrosApi;
