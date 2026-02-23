import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Copy } from 'lucide-react';
import { useBaseEndereco, BaseEndereco } from '@/hooks/useBaseEndereco';
import { toast } from "sonner";

interface EnderecosSectionProps {
  cpfId?: number;
  onCountChange?: (count: number) => void;
}

const EnderecosSection: React.FC<EnderecosSectionProps> = ({ cpfId, onCountChange }) => {
  const { isLoading, getEnderecosByCpfId } = useBaseEndereco();
  const [enderecos, setEnderecos] = useState<BaseEndereco[]>([]);
  const [didLoad, setDidLoad] = useState(false);

  const hasData = enderecos.length > 0;
  const sectionCardClass = hasData ? "border-success-border bg-success-subtle" : undefined;

  useEffect(() => {
    const loadEnderecos = async () => {
      setDidLoad(false);
      if (cpfId) {
        const result = await getEnderecosByCpfId(cpfId);
        if (result) {
          setEnderecos(result);
        }
        setDidLoad(true);
      } else {
        setEnderecos([]);
        setDidLoad(true);
      }
    };

    loadEnderecos();
  }, [cpfId, getEnderecosByCpfId]);

  useEffect(() => {
    // Evitar emitir contagem antes do primeiro load (previne validação/cobrança incorreta)
    if (!didLoad) return;
    onCountChange?.(enderecos.length);
  }, [didLoad, onCountChange, enderecos.length]);

  const copyEnderecosData = () => {
    if (enderecos.length === 0) return;
    
    const dados = enderecos.map((end, idx) => 
      `Endereço ${idx + 1}:\n` +
      `CEP: ${end.cep || '-'}\n` +
      `Logradouro: ${end.logradouro || '-'}\n` +
      `Número: ${end.numero || '-'}\n` +
      `Complemento: ${end.complemento || '-'}\n` +
      `Bairro: ${end.bairro || '-'}\n` +
      `Cidade: ${end.cidade || '-'}\n` +
      `UF: ${end.uf || '-'}`
    ).join('\n\n');

    navigator.clipboard.writeText(dados);
    toast.success('Dados dos endereços copiados!');
  };

  if (isLoading) {
    return (
      <Card className={sectionCardClass}>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl min-w-0">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Endereços</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="text-center py-4 text-muted-foreground">
            <div className="animate-spin mx-auto w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">Carregando endereços...</p>
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
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Endereços</span>
          </CardTitle>

          <div className="flex items-center gap-2 flex-shrink-0">
            {enderecos.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyEnderecosData}
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
              {enderecos.length > 0 ? (
                <span
                  className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-1 ring-background"
                  aria-label={`Quantidade de endereços: ${enderecos.length}`}
                >
                  {enderecos.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        {enderecos.length > 0 ? (
          <div className="space-y-4">
            {enderecos.map((endereco, index) => (
              <div key={endereco.id}>
                {index > 0 && <div className="border-t pt-3"></div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`cep_${endereco.id}`}>CEP</Label>
                    <Input
                      id={`cep_${endereco.id}`}
                      value={endereco.cep || ''}
                      disabled
                      className="text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor={`logradouro_${endereco.id}`}>Logradouro</Label>
                    <Input
                      id={`logradouro_${endereco.id}`}
                      value={endereco.logradouro || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`numero_${endereco.id}`}>Número</Label>
                    <Input
                      id={`numero_${endereco.id}`}
                      value={endereco.numero || ''}
                      disabled
                      className="text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`complemento_${endereco.id}`}>Complemento</Label>
                    <Input
                      id={`complemento_${endereco.id}`}
                      value={endereco.complemento || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`bairro_${endereco.id}`}>Bairro</Label>
                    <Input
                      id={`bairro_${endereco.id}`}
                      value={endereco.bairro || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`cidade_${endereco.id}`}>Cidade</Label>
                    <Input
                      id={`cidade_${endereco.id}`}
                      value={endereco.cidade || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`uf_${endereco.id}`}>UF</Label>
                    <Input
                      id={`uf_${endereco.id}`}
                      value={endereco.uf || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm">
              Nenhum endereço adicional encontrado para este CPF
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnderecosSection;
