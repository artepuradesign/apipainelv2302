import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Globe, Users, AlertTriangle, Shield, Save, Gift, TrendingDown } from 'lucide-react';

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxDailyConsultations: number;
  welcomeBonus: number;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  supportEmail: string;
  supportPhone: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  apiTimeout: number;
  maxFileUploadSize: number;
  defaultUserPlan: string;
  systemCurrency: string;
  autoApproveRegistrations: boolean;
}

const SystemSettings = () => {
  const [config, setConfig] = useState<SystemConfig>({
    siteName: 'API Painel',
    siteDescription: 'Sistema completo de consultas e dados',
    maintenanceMode: false,
    registrationEnabled: true,
    maxDailyConsultations: 100,
    welcomeBonus: 0, // Valor será carregado da API externa
    minWithdrawalAmount: 100.00,
    maxWithdrawalAmount: 5000.00,
    supportEmail: 'suporte@apipainel.com',
    supportPhone: '+55 11 99999-9999',
    termsOfServiceUrl: '/termos',
    privacyPolicyUrl: '/privacidade',
    apiTimeout: 30,
    maxFileUploadSize: 5,
    defaultUserPlan: 'Pré-Pago',
    systemCurrency: 'BRL',
    autoApproveRegistrations: false
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = () => {
    const savedConfig = localStorage.getItem('system_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsedConfig }));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  };

  const saveSystemConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('system_config', JSON.stringify(config));
      
      // Simular tempo de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configurações do sistema salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações do sistema');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefaults = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações para os valores padrão?')) {
      localStorage.removeItem('system_config');
      loadSystemConfig();
      toast.success('Configurações resetadas para os valores padrão');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Card de Resumo das Configurações */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Resumo das Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Configurações que serão salvas no banco de dados:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div><strong>Nome do Site:</strong> {config.siteName}</div>
              <div><strong>Descrição:</strong> {config.siteDescription}</div>
              <div><strong>E-mail Suporte:</strong> {config.supportEmail}</div>
              <div><strong>Telefone Suporte:</strong> {config.supportPhone}</div>
              <div><strong>Moeda do Sistema:</strong> {config.systemCurrency}</div>
              <div><strong>Plano Padrão:</strong> {config.defaultUserPlan}</div>
            </div>
            
            <div className="space-y-2">
              <div><strong>Bônus Boas-vindas:</strong> {formatCurrency(config.welcomeBonus)}</div>
              <div><strong>Saque Mín. PIX:</strong> {formatCurrency(config.minWithdrawalAmount)}</div>
              <div><strong>Saque Máx. PIX:</strong> {formatCurrency(config.maxWithdrawalAmount)}</div>
              <div><strong>Consultas Diárias Máx.:</strong> {config.maxDailyConsultations}</div>
              <div><strong>Timeout API:</strong> {config.apiTimeout}s</div>
              <div><strong>Upload Máx.:</strong> {config.maxFileUploadSize}MB</div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-2">
              <Badge className={config.registrationEnabled ? 'bg-green-500' : 'bg-gray-500'}>
                Registros: {config.registrationEnabled ? 'Habilitados' : 'Desabilitados'}
              </Badge>
              <Badge className={config.autoApproveRegistrations ? 'bg-green-500' : 'bg-gray-500'}>
                Aprovação: {config.autoApproveRegistrations ? 'Automática' : 'Manual'}
              </Badge>
              <Badge className={config.maintenanceMode ? 'bg-yellow-500' : 'bg-green-500'}>
                Manutenção: {config.maintenanceMode ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure as definições globais que se aplicam a todo o sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Resetar Padrões
          </Button>
          <Button onClick={saveSystemConfig} disabled={isSaving}>
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Informações Gerais do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">Nome do Site</Label>
              <Input
                id="siteName"
                value={config.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="systemCurrency">Moeda do Sistema</Label>
              <Input
                id="systemCurrency"
                value={config.systemCurrency}
                onChange={(e) => handleInputChange('systemCurrency', e.target.value)}
                placeholder="BRL"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="siteDescription">Descrição do Site</Label>
            <Textarea
              id="siteDescription"
              value={config.siteDescription}
              onChange={(e) => handleInputChange('siteDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supportEmail">E-mail de Suporte</Label>
              <Input
                id="supportEmail"
                type="email"
                value={config.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supportPhone">Telefone de Suporte</Label>
              <Input
                id="supportPhone"
                value={config.supportPhone}
                onChange={(e) => handleInputChange('supportPhone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configurações de Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Registros Habilitados</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Permitir novos cadastros</p>
              </div>
              <Switch
                checked={config.registrationEnabled}
                onCheckedChange={(checked) => handleInputChange('registrationEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Aprovação Automática</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovar registros automaticamente</p>
              </div>
              <Switch
                checked={config.autoApproveRegistrations}
                onCheckedChange={(checked) => handleInputChange('autoApproveRegistrations', checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultUserPlan">Plano Padrão para Novos Usuários</Label>
              <Input
                id="defaultUserPlan"
                value={config.defaultUserPlan}
                onChange={(e) => handleInputChange('defaultUserPlan', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxDailyConsultations">Consultas Diárias Máximas</Label>
              <Input
                id="maxDailyConsultations"
                type="number"
                value={config.maxDailyConsultations}
                onChange={(e) => handleInputChange('maxDailyConsultations', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Financeiras Específicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Configurações de Bonificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Saque Mínimo PIX */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium">Saque PIX</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Valores mínimo e máximo para saque via PIX
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minWithdrawalAmount">Valor Mínimo (R$)</Label>
                <Input
                  id="minWithdrawalAmount"
                  type="number"
                  step="0.01"
                  value={config.minWithdrawalAmount}
                  onChange={(e) => handleInputChange('minWithdrawalAmount', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxWithdrawalAmount">Valor Máximo (R$)</Label>
                <Input
                  id="maxWithdrawalAmount"
                  type="number"
                  step="0.01"
                  value={config.maxWithdrawalAmount}
                  onChange={(e) => handleInputChange('maxWithdrawalAmount', parseFloat(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <div className="space-y-1">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Min: {formatCurrency(config.minWithdrawalAmount)}
                  </Badge>
                  <br />
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Max: {formatCurrency(config.maxWithdrawalAmount)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Bônus de Boas-vindas */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <Label htmlFor="welcomeBonus">Bônus de Boas-vindas (R$)</Label>
              <Input
                id="welcomeBonus"
                type="number"
                step="0.01"
                value={config.welcomeBonus}
                onChange={(e) => handleInputChange('welcomeBonus', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiTimeout">Timeout da API (segundos)</Label>
              <Input
                id="apiTimeout"
                type="number"
                value={config.apiTimeout}
                onChange={(e) => handleInputChange('apiTimeout', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxFileUploadSize">Tamanho Máximo de Upload (MB)</Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                value={config.maxFileUploadSize}
                onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="termsOfServiceUrl">URL dos Termos de Serviço</Label>
              <Input
                id="termsOfServiceUrl"
                value={config.termsOfServiceUrl}
                onChange={(e) => handleInputChange('termsOfServiceUrl', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="privacyPolicyUrl">URL da Política de Privacidade</Label>
              <Input
                id="privacyPolicyUrl"
                value={config.privacyPolicyUrl}
                onChange={(e) => handleInputChange('privacyPolicyUrl', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Segurança e Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança e Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Modo de Manutenção
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bloqueia acesso ao sistema para usuários regulares
                </p>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
              />
            </div>
          </div>

          {config.maintenanceMode && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Modo de Manutenção Ativo
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                O sistema está em modo de manutenção. Apenas usuários de suporte podem acessar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
