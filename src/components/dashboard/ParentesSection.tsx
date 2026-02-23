import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Copy } from 'lucide-react';
import { useBaseParente } from '@/hooks/useBaseParente';
import { BaseParente } from '@/services/baseParenteService';
import { formatCpf } from '@/utils/formatters';
import { toast } from "sonner";

interface ParentesSectionProps {
  cpfId: number;
  onCountChange?: (count: number) => void;
}

const ParentesSection: React.FC<ParentesSectionProps> = ({ cpfId, onCountChange }) => {
  const [parentes, setParentes] = useState<BaseParente[]>([]);
  const [loading, setLoading] = useState(true);
  const { getParentesByCpfId } = useBaseParente();

  const hasData = parentes.length > 0;
  const sectionCardClass = hasData ? "border-success-border bg-success-subtle" : undefined;

  useEffect(() => {
    console.info('[Parentes][UI] Mount/Update -> cpfId:', cpfId);
    loadParentes();
  }, [cpfId]);

  useEffect(() => {
    // Evitar emitir contagem antes do carregamento terminar (previne validação/cobrança incorreta)
    if (loading) return;
    onCountChange?.(parentes.length);
  }, [loading, onCountChange, parentes.length]);

  const loadParentes = async () => {
    setLoading(true);
    try {
      const data = await getParentesByCpfId(cpfId);
      console.info('[Parentes][UI] Loaded registros:', Array.isArray(data) ? data.length : 'N/A');
      setParentes(data);
    } catch (error) {
      console.error('[Parentes][UI] Erro ao carregar parentes:', error);
      setParentes([]);
    } finally {
      setLoading(false);
    }
  };

  const copyParentesData = () => {
    if (parentes.length === 0) return;
    
    const dados = parentes.map((parente, idx) => 
      `Parente ${idx + 1}:\n` +
      `Nome: ${parente.nome_vinculo || '-'}\n` +
      `Vínculo: ${parente.vinculo || '-'}\n` +
      `CPF: ${parente.cpf_vinculo ? formatCpf(parente.cpf_vinculo) : '-'}`
    ).join('\n\n');

    navigator.clipboard.writeText(dados);
    toast.success('Dados dos parentes copiados!');
  };

  if (loading) {
    return (
      <Card className={sectionCardClass}>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl min-w-0">
            <User className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Parentes</span>
          </CardTitle>
          <CardDescription>Informações sobre parentesco</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="text-center py-4 text-muted-foreground">
            <div className="animate-spin mx-auto w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">Carregando...</p>
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
            <User className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Parentes</span>
          </CardTitle>

          <div className="flex items-center gap-2 flex-shrink-0">
            {parentes.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyParentesData}
                className="h-8 w-8"
                title="Copiar dados da seção"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}

            <div className="relative inline-flex">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Online
              </Badge>
              {parentes.length > 0 ? (
                <span
                  className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-1 ring-background"
                  aria-label={`Quantidade de parentes: ${parentes.length}`}
                >
                  {parentes.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        {parentes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm">Nenhum parente encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parentes.map((parente, index) => (
              <div key={parente.id}>
                {index > 0 && <div className="border-t pt-3"></div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`nome_${parente.id}`}>Nome</Label>
                    <Input
                      id={`nome_${parente.id}`}
                      value={parente.nome_vinculo?.toUpperCase() || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`vinculo_${parente.id}`}>Vínculo</Label>
                    <Input
                      id={`vinculo_${parente.id}`}
                      value={parente.vinculo?.toUpperCase() || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`cpf_${parente.id}`}>CPF</Label>
                    <Input
                      id={`cpf_${parente.id}`}
                      value={parente.cpf_vinculo ? formatCpf(parente.cpf_vinculo) : ''}
                      disabled
                      className="text-[14px] md:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParentesSection;
