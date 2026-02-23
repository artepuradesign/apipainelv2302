import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Copy } from 'lucide-react';
import { useBaseDividasAtivas } from '@/hooks/useBaseDividasAtivas';
import { toast } from "sonner";

interface DividasAtivasSectionProps {
  cpf: string;
  onCountChange?: (count: number) => void;
}

const DividasAtivasSection: React.FC<DividasAtivasSectionProps> = ({ cpf, onCountChange }) => {
  const { getDividasAtivasByCpf, dividasAtivas, isLoading, clearData } = useBaseDividasAtivas();
  const [dataLoaded, setDataLoaded] = useState(false);
  const lastCpfRef = useRef<string | null>(null);

  const formatDateBr = (date?: string) => {
    if (!date) return '-';
    // Espera formato yyyy-mm-dd (ou ISO). Força meia-noite local para evitar variação por fuso.
    const d = new Date(date.includes('T') ? date : `${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString('pt-BR');
  };

  const formatCurrencyBr = (value?: number | string | null) => {
    if (value === null || value === undefined || value === '') return '-';
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return String(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const hasData = useMemo(() => (dividasAtivas?.length ?? 0) > 0, [dividasAtivas?.length]);
  const sectionCardClass = useMemo(
    () => (hasData ? 'border-success-border bg-success-subtle' : undefined),
    [hasData]
  );

  // Se o CPF mudar, resetar para disparar nova busca (mesmo padrão do CNPJ MEI)
  useEffect(() => {
    if (!cpf) return;

    if (lastCpfRef.current !== cpf) {
      lastCpfRef.current = cpf;
      setDataLoaded(false);
      clearData();
    }
  }, [cpf, clearData]);

  useEffect(() => {
    if (cpf && !dataLoaded) {
      console.log('🔄 [DIVIDAS_ATIVAS_SECTION] Buscando dados para CPF ID:', cpf);
      getDividasAtivasByCpf(cpf).finally(() => setDataLoaded(true));
    }
  }, [cpf, getDividasAtivasByCpf, dataLoaded]);

  useEffect(() => {
    onCountChange?.(dividasAtivas?.length ?? 0);
  }, [dividasAtivas?.length, onCountChange]);

  console.log('🔍 [DIVIDAS_ATIVAS_SECTION] Estado atual:', {
    cpf,
    isLoading,
    dividasAtivasCount: dividasAtivas?.length || 0,
    dividasAtivas
  });

  const copyDividasData = () => {
    if (!dividasAtivas || dividasAtivas.length === 0) return;
    
    const dados = dividasAtivas.map((divida, idx) => 
      `Dívida ${idx + 1}:\n` +
      `UF: ${divida.uf_devedor || '-'}\n` +
      `Número Inscrição: ${divida.numero_inscricao || '-'}\n` +
      `Tipo Situação: ${divida.tipo_situacao_inscricao || '-'}\n` +
      `Situação: ${divida.situacao_inscricao || '-'}\n` +
      `Receita Principal: ${divida.receita_principal || '-'}\n` +
      `Data Inscrição: ${formatDateBr(divida.data_inscricao)}\n` +
      `Indicador Ajuizado: ${divida.indicador_ajuizado || '-'}\n` +
      `Valor Consolidado: ${formatCurrencyBr(divida.valor_consolidado)}`
    ).join('\n\n');

    navigator.clipboard.writeText(dados);
    toast.success('Dados de dívidas ativas copiados!');
  };

  if (isLoading) {
    return (
      <Card className={sectionCardClass}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Dívidas Ativas (SIDA)</span>
              </CardTitle>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant="secondary"
                className={hasData ? 'bg-success text-success-foreground uppercase tracking-wide' : 'uppercase tracking-wide'}
              >
                Online
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dividasAtivas || dividasAtivas.length === 0) {
    return (
      <Card className={sectionCardClass}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Dívidas Ativas (SIDA)</span>
              </CardTitle>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Online
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={sectionCardClass}>
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Dívidas Ativas (SIDA)</span>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {hasData && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyDividasData}
                className="h-8 w-8"
                title="Copiar dados da seção"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}

            <div className="relative inline-flex">
              <Badge
                variant="secondary"
                className={hasData ? 'bg-success text-success-foreground uppercase tracking-wide' : 'uppercase tracking-wide'}
              >
                Online
              </Badge>
              {hasData ? (
                <span
                  className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-1 ring-background"
                  aria-label={`Quantidade de dívidas ativas: ${dividasAtivas.length}`}
                >
                  {dividasAtivas.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dividasAtivas.map((divida, index) => (
          <div key={divida.id || index}>
            {index > 0 && <div className="border-t pt-3"></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`uf_${divida.id}`}>UF Devedor</Label>
                <Input
                  id={`uf_${divida.id}`}
                  value={divida.uf_devedor || '-'}
                  disabled
                  className="bg-muted uppercase text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`numero_${divida.id}`}>Número Inscrição</Label>
                <Input
                  id={`numero_${divida.id}`}
                  value={divida.numero_inscricao || '-'}
                  disabled
                  className="bg-muted text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`tipo_situacao_${divida.id}`}>Tipo Situação Inscrição</Label>
                <Input
                  id={`tipo_situacao_${divida.id}`}
                  value={divida.tipo_situacao_inscricao || '-'}
                  disabled
                  className="bg-muted uppercase text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`situacao_${divida.id}`}>Situação Inscrição</Label>
                <Input
                  id={`situacao_${divida.id}`}
                  value={divida.situacao_inscricao || '-'}
                  disabled
                  className="bg-muted uppercase text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`receita_${divida.id}`}>Receita Principal</Label>
                <Input
                  id={`receita_${divida.id}`}
                  value={divida.receita_principal || '-'}
                  disabled
                  className="bg-muted uppercase text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`data_${divida.id}`}>Data Inscrição</Label>
                <Input
                  id={`data_${divida.id}`}
                  value={formatDateBr(divida.data_inscricao)}
                  disabled
                  className="bg-muted text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`ajuizado_${divida.id}`}>Indicador Ajuizado</Label>
                <Input
                  id={`ajuizado_${divida.id}`}
                  value={divida.indicador_ajuizado || '-'}
                  disabled
                  className="bg-muted uppercase text-[14px] md:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor={`valor_${divida.id}`}>Valor Consolidado</Label>
                <Input
                  id={`valor_${divida.id}`}
                  value={formatCurrencyBr(divida.valor_consolidado)}
                  disabled
                  className="bg-muted text-[14px] md:text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DividasAtivasSection;
