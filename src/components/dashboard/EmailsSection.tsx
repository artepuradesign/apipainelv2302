import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy } from 'lucide-react';
import { useBaseEmail } from '@/hooks/useBaseEmail';
import { BaseEmail } from '@/services/baseEmailService';
import { toast } from "sonner";
import { formatDateOnly } from '@/utils/formatters';

interface EmailsSectionProps {
  cpfId?: number;
  onCountChange?: (count: number) => void;
  /** Modo compacto para telas específicas (ex.: CPF Simples) */
  compact?: boolean;
}

const EmailsSection: React.FC<EmailsSectionProps> = ({ cpfId, onCountChange, compact = false }) => {
  const { isLoading, getEmailsByCpfId } = useBaseEmail();
  const [emails, setEmails] = useState<BaseEmail[]>([]);
  const [didLoad, setDidLoad] = useState(false);

  const hasData = emails.length > 0;
  const sectionCardClass = hasData ? "border-success-border bg-success-subtle" : undefined;

  useEffect(() => {
    const loadEmails = async () => {
      setDidLoad(false);
      if (cpfId) {
        const result = await getEmailsByCpfId(cpfId);
        if (result) {
          setEmails(result);
        }
        setDidLoad(true);
      } else {
        setEmails([]);
        setDidLoad(true);
      }
    };

    loadEmails();
  }, [cpfId, getEmailsByCpfId]);

  useEffect(() => {
    // Evitar emitir contagem antes do primeiro load (previne validação/cobrança incorreta)
    if (!didLoad) return;
    onCountChange?.(emails.length);
  }, [didLoad, onCountChange, emails.length]);

  const copyEmailsData = () => {
    if (emails.length === 0) return;

    const safeDataInclusao = (value?: string | null) => {
      if (!value || value === '0000-00-00') return '-';
      return formatDateOnly(value);
    };
    
    const dados = emails.map((email, idx) => 
      `Email ${idx + 1}:\n` +
      `Endereço: ${email.email || '-'}\n` +
      `Score: ${email.score_email || '-'}\n` +
      `Pessoal: ${email.email_pessoal || '-'}` +
      (compact
        ? ''
        : `\nPrioridade: ${email.prioridade ?? '-'}\n` +
          `Duplicado: ${email.email_duplicado || '-'}\n` +
          `Blacklist: ${email.blacklist || '-'}\n` +
          `Estrutura: ${email.estrutura || '-'}\n` +
          `Status VT: ${email.status_vt || '-'}\n` +
          `Domínio: ${email.dominio || '-'}\n` +
          `Mapas: ${email.mapas ?? '-'}\n` +
          `Peso: ${email.peso ?? '-'}\n` +
          `Data inclusão: ${safeDataInclusao(email.data_inclusao)}`)
    ).join('\n\n');

    navigator.clipboard.writeText(dados);
    toast.success('Dados dos emails copiados!');
  };

  if (isLoading) {
    return (
      <Card className={sectionCardClass}>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl min-w-0">
            <Mail className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Emails</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="text-center py-4 text-muted-foreground">
            <div className="animate-spin mx-auto w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">Carregando emails...</p>
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
            <Mail className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Emails</span>
          </CardTitle>

          <div className="flex items-center gap-2 flex-shrink-0">
            {emails.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyEmailsData}
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
              {emails.length > 0 ? (
                <span
                  className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-1 ring-background"
                  aria-label={`Quantidade de emails: ${emails.length}`}
                >
                  {emails.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        {emails.length > 0 ? (
          <div className="space-y-4">
            {emails.map((email, index) => (
              <div key={email.id}>
                {index > 0 && <div className="border-t pt-3"></div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`email_${email.id}`}>Email</Label>
                    <Input
                      id={`email_${email.id}`}
                      value={email.email || ''}
                      disabled
                      className="lowercase text-[14px] md:text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`score_${email.id}`}>Score</Label>
                    <Input
                      id={`score_${email.id}`}
                      value={email.score_email || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`pessoal_${email.id}`}>Pessoal</Label>
                    <Input
                      id={`pessoal_${email.id}`}
                      value={email.email_pessoal || ''}
                      disabled
                      className="uppercase text-[14px] md:text-sm"
                    />
                  </div>

                  {!compact ? (
                    <>
                      <div>
                        <Label htmlFor={`prioridade_${email.id}`}>Prioridade</Label>
                        <Input
                          id={`prioridade_${email.id}`}
                          value={email.prioridade ?? ''}
                          disabled
                          className="text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`duplicado_${email.id}`}>Duplicado</Label>
                        <Input
                          id={`duplicado_${email.id}`}
                          value={email.email_duplicado || ''}
                          disabled
                          className="uppercase text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`blacklist_${email.id}`}>Blacklist</Label>
                        <Input
                          id={`blacklist_${email.id}`}
                          value={email.blacklist || ''}
                          disabled
                          className="uppercase text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`estrutura_${email.id}`}>Estrutura</Label>
                        <Input
                          id={`estrutura_${email.id}`}
                          value={email.estrutura || ''}
                          disabled
                          className="uppercase text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`statusvt_${email.id}`}>Status VT</Label>
                        <Input
                          id={`statusvt_${email.id}`}
                          value={email.status_vt || ''}
                          disabled
                          className="uppercase text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`dominio_${email.id}`}>Domínio</Label>
                        <Input
                          id={`dominio_${email.id}`}
                          value={email.dominio || ''}
                          disabled
                          className="uppercase text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`mapas_${email.id}`}>Mapas</Label>
                        <Input
                          id={`mapas_${email.id}`}
                          value={email.mapas ?? ''}
                          disabled
                          className="text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`peso_${email.id}`}>Peso</Label>
                        <Input
                          id={`peso_${email.id}`}
                          value={email.peso ?? ''}
                          disabled
                          className="text-[14px] md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`data_${email.id}`}>Data inclusão</Label>
                        <Input
                          id={`data_${email.id}`}
                          value={email.data_inclusao && email.data_inclusao !== '0000-00-00' ? formatDateOnly(email.data_inclusao) : '-'}
                          disabled
                          className="text-[14px] md:text-sm"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm">
              Nenhum email adicional encontrado para este CPF
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailsSection;
