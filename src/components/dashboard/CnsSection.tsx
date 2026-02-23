import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, FileText, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid, parseISO } from 'date-fns';
import { useBaseCns } from '@/hooks/useBaseCns';
import type { BaseCns } from '@/services/baseCnsService';

interface CnsSectionProps {
  cpfId?: number;
  onCountChange?: (count: number) => void;
}

const formatBrazilianDate = (value?: string | null) => {
  if (!value) return '';
  const iso = parseISO(value);
  if (isValid(iso)) return format(iso, 'dd/MM/yyyy');
  const d = new Date(value);
  if (isValid(d)) return format(d, 'dd/MM/yyyy');
  return value;
};

const tipoLabel = (t?: string | null) => {
  if (t === 'D') return 'Definitivo';
  if (t === 'P') return 'Provisório';
  return '';
};

const CnsSection: React.FC<CnsSectionProps> = ({ cpfId, onCountChange }) => {
  const { isLoading, error, getCnsByCpfId } = useBaseCns();
  const [items, setItems] = useState<BaseCns[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!cpfId) return;
      const data = await getCnsByCpfId(cpfId);
      setItems(data);
    };
    load();
  }, [cpfId, getCnsByCpfId]);

  useEffect(() => {
    onCountChange?.(items.length);
  }, [onCountChange, items.length]);

  const hasData = useMemo(() => items.length > 0, [items]);
  const sectionCardClass = hasData ? 'border-success-border bg-success-subtle' : undefined;

  const copyData = () => {
    if (!hasData) return;
    const text = items
      .map((i, idx) => {
        const tipo = tipoLabel(i.tipo_cartao) || i.tipo_cartao;
        return [
          `CNS #${idx + 1}`,
          `Número: ${i.numero_cns || '-'}`,
          `Tipo: ${tipo || '-'}`,
        ].join('\n');
      })
      .join('\n\n');

    navigator.clipboard.writeText(text);
    toast.success('CNS copiado!');
  };

  if (isLoading) {
    return (
      <Card className={sectionCardClass}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl min-w-0">
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">CNS</span>
            </CardTitle>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Online
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="text-center py-4 text-muted-foreground">
            <div className="animate-spin mx-auto w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
            <p className="text-xs sm:text-sm">Carregando CNS...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={sectionCardClass}>
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl min-w-0">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">CNS</span>
          </CardTitle>

          <div className="flex items-center gap-2 flex-shrink-0">
            {hasData ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyData}
                className="h-8 w-8"
                title="Copiar dados da seção"
              >
                <Copy className="h-4 w-4" />
              </Button>
            ) : null}

            <div className="relative inline-flex">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Online
              </Badge>
              {items.length > 0 ? (
                <span
                  className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-1 ring-background"
                  aria-label={`Quantidade de CNS: ${items.length}`}
                >
                  {items.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
        {!hasData ? (
          <div className="text-center py-4 text-muted-foreground">
            <SearchX className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs sm:text-sm">
              {error ? error : 'Nenhum registro encontrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id ?? item.numero_cns} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs sm:text-sm" htmlFor={`cns_numero_${item.id}`}>Número CNS</Label>
                  <Input
                    id={`cns_numero_${item.id}`}
                    value={item.numero_cns || ''}
                    disabled
                    className="bg-muted text-[14px] md:text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs sm:text-sm" htmlFor={`cns_tipo_${item.id}`}>Tipo</Label>
                  <Input
                    id={`cns_tipo_${item.id}`}
                    value={tipoLabel(item.tipo_cartao) || item.tipo_cartao || ''}
                    disabled
                    className="bg-muted text-[14px] md:text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CnsSection;
