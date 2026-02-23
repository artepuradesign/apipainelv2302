import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, ShoppingCart, CheckCircle, Loader2, AlertCircle, Clock, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { editaveisRgService, type EditavelRgArquivo, type EditavelRgCompra } from '@/services/editaveisRgService';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import { useApiModules } from '@/hooks/useApiModules';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { getPlanType } from '@/utils/planUtils';

interface ArquivoFormData {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  versao: string;
  formato: string;
  tamanho_arquivo: string;
  arquivo_url: string;
  preview_url: string;
  preco: string;
}

const emptyForm: ArquivoFormData = {
  titulo: '',
  descricao: '',
  categoria: '',
  tipo: 'RG',
  versao: '',
  formato: '.CDR',
  tamanho_arquivo: '',
  arquivo_url: '',
  preview_url: '',
  preco: '0',
};

const EditaveisRg = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isAdmin = profile?.user_role === 'admin' || profile?.user_role === 'suporte';
  const { balance, loadBalance: reloadBalance } = useWalletBalance();
  const { modules } = useApiModules();
  const {
    hasActiveSubscription,
    subscription,
    discountPercentage,
    calculateDiscountedPrice: calculateSubscriptionDiscount,
    isLoading: subscriptionLoading
  } = useUserSubscription();

  // Encontrar módulo ID 85
  const currentModule = useMemo(() => {
    return (modules || []).find((m: any) => m.id === 85) || null;
  }, [modules]);

  const modulePrice = useMemo(() => {
    return Number(currentModule?.price ?? 0);
  }, [currentModule]);

  const userPlan = hasActiveSubscription && subscription
    ? subscription.plan_name
    : (user ? localStorage.getItem(`user_plan_${user.id}`) || 'Pré-Pago' : 'Pré-Pago');

  const { discountedPrice: finalPrice, hasDiscount } = hasActiveSubscription
    ? calculateSubscriptionDiscount(modulePrice)
    : { discountedPrice: modulePrice, hasDiscount: false };

  const discount = hasDiscount ? discountPercentage : 0;
  const originalPrice = modulePrice;

  const [arquivos, setArquivos] = useState<EditavelRgArquivo[]>([]);
  const [compras, setCompras] = useState<EditavelRgCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprasLoading, setComprasLoading] = useState(true);
  const [selectedArquivo, setSelectedArquivo] = useState<EditavelRgArquivo | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Admin modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingArquivo, setEditingArquivo] = useState<EditavelRgArquivo | null>(null);
  const [deletingArquivo, setDeletingArquivo] = useState<EditavelRgArquivo | null>(null);
  const [formData, setFormData] = useState<ArquivoFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const walletBalance = balance.saldo || 0;
  const planBalance = balance.saldo_plano || 0;
  const totalBalance = walletBalance + planBalance;

  const loadArquivos = useCallback(async () => {
    try {
      setLoading(true);
      const result = await editaveisRgService.listArquivos({ limit: 100 });
      if (result.success && result.data) {
        setArquivos(result.data.data || []);
      } else {
        setArquivos([]);
      }
    } catch {
      setArquivos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompras = useCallback(async () => {
    try {
      setComprasLoading(true);
      const result = await editaveisRgService.minhasCompras({ limit: 100 });
      if (result.success && result.data) {
        setCompras(result.data.data || []);
      } else {
        setCompras([]);
      }
    } catch {
      setCompras([]);
    } finally {
      setComprasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadArquivos();
    loadCompras();
    reloadBalance();
  }, [user, loadArquivos, loadCompras, reloadBalance]);

  const handleSelectArquivo = (arquivo: EditavelRgArquivo) => {
    if (arquivo.comprado) {
      handleDownload(arquivo.id);
      return;
    }
    setSelectedArquivo(arquivo);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedArquivo) return;
    setIsPurchasing(true);

    try {
      const walletType = planBalance >= selectedArquivo.preco ? 'plan' : 'main';
      const result = await editaveisRgService.comprar(selectedArquivo.id, walletType);

      if (result.success && result.data) {
        toast.success(`Arquivo "${result.data.titulo}" adquirido com sucesso!`);
        setShowConfirmModal(false);
        setSelectedArquivo(null);

        if (result.data.ja_comprado) {
          window.open(result.data.arquivo_url, '_blank');
        }

        await Promise.all([loadArquivos(), loadCompras(), reloadBalance()]);
      } else {
        toast.error(result.error || 'Erro ao adquirir arquivo');
      }
    } catch (error) {
      toast.error('Erro ao processar compra');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDownload = async (arquivoId: number) => {
    try {
      const result = await editaveisRgService.download(arquivoId);
      if (result.success && result.data) {
        window.open(result.data.arquivo_url, '_blank');
        toast.success(`Download de "${result.data.titulo}" iniciado`);
        loadArquivos();
        loadCompras();
      } else {
        toast.error(result.error || 'Erro ao baixar arquivo');
      }
    } catch {
      toast.error('Erro ao processar download');
    }
  };

  const formatPrice = (value: number) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

  // Admin handlers
  const handleOpenCreate = () => {
    setFormData(emptyForm);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (arquivo: EditavelRgArquivo) => {
    setEditingArquivo(arquivo);
    setFormData({
      titulo: arquivo.titulo || '',
      descricao: arquivo.descricao || '',
      categoria: arquivo.categoria || '',
      tipo: arquivo.tipo || 'RG',
      versao: arquivo.versao || '',
      formato: arquivo.formato || '.CDR',
      tamanho_arquivo: arquivo.tamanho_arquivo || '',
      arquivo_url: arquivo.arquivo_url || '',
      preview_url: arquivo.preview_url || '',
      preco: String(arquivo.preco ?? 0),
    });
    setShowEditModal(true);
  };

  const handleOpenDelete = (arquivo: EditavelRgArquivo) => {
    setDeletingArquivo(arquivo);
    setShowDeleteModal(true);
  };

  const handleCreate = async () => {
    if (!formData.titulo || !formData.arquivo_url) {
      toast.error('Título e URL do arquivo são obrigatórios');
      return;
    }
    setIsSaving(true);
    try {
      const result = await editaveisRgService.criar({
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        categoria: formData.categoria || undefined,
        tipo: formData.tipo || 'RG',
        versao: formData.versao || undefined,
        formato: formData.formato || '.CDR',
        tamanho_arquivo: formData.tamanho_arquivo || undefined,
        arquivo_url: formData.arquivo_url,
        preview_url: formData.preview_url || undefined,
        preco: parseFloat(formData.preco) || 0,
      });
      if (result.success) {
        toast.success('Arquivo criado com sucesso!');
        setShowCreateModal(false);
        loadArquivos();
      } else {
        toast.error(result.error || 'Erro ao criar arquivo');
      }
    } catch {
      toast.error('Erro ao criar arquivo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingArquivo) return;
    setIsSaving(true);
    try {
      const result = await editaveisRgService.atualizar({
        id: editingArquivo.id,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        categoria: formData.categoria || null,
        tipo: formData.tipo || 'RG',
        versao: formData.versao || null,
        formato: formData.formato || '.CDR',
        tamanho_arquivo: formData.tamanho_arquivo || null,
        arquivo_url: formData.arquivo_url,
        preview_url: formData.preview_url || null,
        preco: parseFloat(formData.preco) || 0,
      });
      if (result.success) {
        toast.success('Arquivo atualizado com sucesso!');
        setShowEditModal(false);
        setEditingArquivo(null);
        loadArquivos();
      } else {
        toast.error(result.error || 'Erro ao atualizar arquivo');
      }
    } catch {
      toast.error('Erro ao atualizar arquivo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingArquivo) return;
    setIsSaving(true);
    try {
      const result = await editaveisRgService.excluir(deletingArquivo.id);
      if (result.success) {
        toast.success('Arquivo excluído com sucesso!');
        setShowDeleteModal(false);
        setDeletingArquivo(null);
        loadArquivos();
      } else {
        toast.error(result.error || 'Erro ao excluir arquivo');
      }
    } catch {
      toast.error('Erro ao excluir arquivo');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof ArquivoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Form fields component
  const renderFormFields = () => (
    <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid gap-1.5">
        <Label htmlFor="titulo">Título *</Label>
        <Input id="titulo" value={formData.titulo} onChange={e => updateField('titulo', e.target.value)} placeholder="Nome do arquivo" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" value={formData.descricao} onChange={e => updateField('descricao', e.target.value)} placeholder="Descrição do arquivo" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="categoria">Categoria</Label>
          <Input id="categoria" value={formData.categoria} onChange={e => updateField('categoria', e.target.value)} placeholder="Ex: Frente" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Input id="tipo" value={formData.tipo} onChange={e => updateField('tipo', e.target.value)} placeholder="Ex: RG" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="versao">Versão</Label>
          <Input id="versao" value={formData.versao} onChange={e => updateField('versao', e.target.value)} placeholder="Ex: 2024" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="formato">Formato</Label>
          <Input id="formato" value={formData.formato} onChange={e => updateField('formato', e.target.value)} placeholder=".CDR" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tamanho_arquivo">Tamanho</Label>
          <Input id="tamanho_arquivo" value={formData.tamanho_arquivo} onChange={e => updateField('tamanho_arquivo', e.target.value)} placeholder="Ex: 15MB" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="preco">Preço (R$)</Label>
          <Input id="preco" type="number" step="0.01" value={formData.preco} onChange={e => updateField('preco', e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="arquivo_url">URL do Arquivo *</Label>
        <Input id="arquivo_url" value={formData.arquivo_url} onChange={e => updateField('arquivo_url', e.target.value)} placeholder="https://..." />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="preview_url">URL da Preview</Label>
        <Input id="preview_url" value={formData.preview_url} onChange={e => updateField('preview_url', e.target.value)} placeholder="https://..." />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SimpleTitleBar
        title="Editáveis RG"
        subtitle="Arquivos editáveis em CorelDraw (.CDR)"
        onBack={() => navigate('/dashboard')}
        icon={<FileText className="h-5 w-5" />}
        right={
          isAdmin ? (
            <Button
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={handleOpenCreate}
              title="Novo Arquivo"
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : undefined
        }
      />

      {/* Card de Preço do Módulo com Desconto */}
      {modulePrice > 0 && (
        <div className="relative bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30 dark:from-gray-800/50 dark:via-gray-800 dark:to-purple-900/20 rounded-lg border border-purple-100/50 dark:border-purple-800/30 shadow-sm transition-all duration-300">
          {hasDiscount && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-2.5 py-1 text-xs font-bold shadow-lg">
                {discount}% OFF
              </Badge>
            </div>
          )}
          <div className="relative p-3.5 md:p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Plano Ativo
                  </p>
                  <h3 className="text-sm md:text-base font-bold text-foreground truncate">
                    {hasActiveSubscription ? subscription?.plan_name : userPlan}
                  </h3>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                {hasDiscount && (
                  <span className="text-[10px] md:text-xs text-muted-foreground line-through">
                    R$ {originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                  R$ {finalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Arquivos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando arquivos...</span>
        </div>
      ) : arquivos.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum arquivo disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {arquivos.map((arquivo) => (
            <Card
              key={arquivo.id}
              className={`bg-card border-border hover:shadow-lg transition-shadow cursor-pointer ${
                arquivo.comprado ? 'ring-2 ring-green-500/30' : ''
              }`}
              onClick={() => handleSelectArquivo(arquivo)}
            >
              {/* Preview da imagem */}
              {arquivo.preview_url && (
                <div className="w-full h-28 sm:h-36 overflow-hidden rounded-t-lg">
                  <img
                    src={arquivo.preview_url}
                    alt={arquivo.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <CardHeader className="p-3 md:pb-2 md:p-6">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm md:text-base leading-tight line-clamp-2">{arquivo.titulo}</CardTitle>
                  {arquivo.comprado && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0 text-[10px] md:text-xs">
                      <CheckCircle className="h-3 w-3 mr-0.5 md:mr-1" />
                      Adquirido
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-2 md:space-y-3">
                {arquivo.descricao && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{arquivo.descricao}</p>
                )}
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <Badge variant="outline" className="text-[10px] md:text-xs">{arquivo.formato || '.CDR'}</Badge>
                  {arquivo.tamanho_arquivo && (
                    <Badge variant="outline" className="text-[10px] md:text-xs">{arquivo.tamanho_arquivo}</Badge>
                  )}
                  {arquivo.categoria && (
                    <Badge variant="outline" className="text-[10px] md:text-xs">{arquivo.categoria}</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs md:text-sm font-semibold text-foreground">
                    {formatPrice(arquivo.preco)}
                  </span>
                  <div className="flex gap-1">
                    {isAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 md:h-8 md:w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(arquivo);
                          }}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(arquivo);
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant={arquivo.comprado ? 'outline' : 'default'}
                      className="h-7 md:h-8 text-xs md:text-sm px-2 md:px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectArquivo(arquivo);
                      }}
                    >
                      {arquivo.comprado ? (
                        <>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Baixar
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          Comprar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico de Compras */}
      {!comprasLoading && compras.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Histórico de Compras
          </h3>
          <Card className="bg-card border-border overflow-hidden">
            {/* Mobile: cards | Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Preço Pago</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((compra) => (
                    <TableRow key={compra.id}>
                      <TableCell className="font-medium">{compra.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{compra.formato || '.CDR'}</Badge>
                      </TableCell>
                      <TableCell>{formatPrice(compra.preco_pago)}</TableCell>
                      <TableCell>{compra.downloads_count}x</TableCell>
                      <TableCell>{new Date(compra.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(compra.arquivo_id)}>
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-border">
              {compras.map((compra) => (
                <div key={compra.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{compra.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(compra.created_at).toLocaleDateString('pt-BR')} · {compra.downloads_count}x downloads
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">{formatPrice(compra.preco_pago)}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => handleDownload(compra.arquivo_id)}>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Compra */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Confirmar Compra
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes antes de confirmar a aquisição do arquivo.
            </DialogDescription>
          </DialogHeader>

          {selectedArquivo && (
            <div className="space-y-4">
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-3 md:p-4 space-y-2">
                  <p className="font-semibold text-foreground">{selectedArquivo.titulo}</p>
                  {selectedArquivo.descricao && (
                    <p className="text-sm text-muted-foreground">{selectedArquivo.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedArquivo.formato || '.CDR'}</Badge>
                    {selectedArquivo.tamanho_arquivo && (
                      <Badge variant="outline">{selectedArquivo.tamanho_arquivo}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2 text-sm">
                {hasDiscount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço original:</span>
                    <span className="font-semibold text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-semibold text-foreground">{formatPrice(finalPrice)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconto:</span>
                    <span className="font-semibold text-green-600">{discount}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo disponível:</span>
                  <span className={`font-semibold ${totalBalance >= finalPrice ? 'text-green-600' : 'text-destructive'}`}>
                    {formatPrice(totalBalance)}
                  </span>
                </div>
                {totalBalance < finalPrice && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-xs">Saldo insuficiente para esta compra.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isPurchasing}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              disabled={isPurchasing || !selectedArquivo || totalBalance < finalPrice}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Compra
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Arquivo */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Novo Arquivo
            </DialogTitle>
            <DialogDescription>Preencha os dados do novo arquivo editável.</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Criar Arquivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Arquivo */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Arquivo
            </DialogTitle>
            <DialogDescription>Atualize os dados do arquivo editável.</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Arquivo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{deletingArquivo?.titulo}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditaveisRg;
