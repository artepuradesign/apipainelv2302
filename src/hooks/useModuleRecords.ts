import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { moduleHistoryService } from '@/services/moduleHistoryService';

/**
 * Hook que verifica se o usuário possui registros em módulos específicos.
 * Usado para permitir acesso a módulos com histórico mesmo sem saldo suficiente.
 * 
 * Utiliza localStorage como cache para evitar chamadas repetitivas à API.
 */
export const useModuleRecords = () => {
  const { user } = useAuth();
  const [modulesWithRecords, setModulesWithRecords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `module_records_${user.id}`;

    // Carregar cache do localStorage
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { routes: string[]; ts: number };
        // Cache válido por 5 minutos
        if (Date.now() - parsed.ts < 5 * 60 * 1000) {
          setModulesWithRecords(new Set(parsed.routes));
          setIsLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    // Rotas dos módulos QRCode que devem ser verificados
    const qrcodeRoutes = [
      '/dashboard/qrcode-rg-6m',
      '/dashboard/qrcode-rg-3m',
      '/dashboard/qrcode-rg-1m',
    ];

    const checkRecords = async () => {
      const routesWithRecords: string[] = [];

      await Promise.all(
        qrcodeRoutes.map(async (route) => {
          try {
            const stats = await moduleHistoryService.getStats(route);
            if (stats.success && stats.data.total > 0) {
              routesWithRecords.push(route);
            }
          } catch {
            // Silenciar erros - não bloquear por falha de verificação
          }
        })
      );

      setModulesWithRecords(new Set(routesWithRecords));
      setIsLoading(false);

      // Salvar cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ routes: routesWithRecords, ts: Date.now() }));
      } catch { /* ignore */ }
    };

    checkRecords();
  }, [user]);

  /**
   * Verifica se o módulo na rota informada possui registros do usuário.
   */
  const hasRecordsInModule = (moduleRoute: string): boolean => {
    return modulesWithRecords.has(moduleRoute);
  };

  /**
   * Marca manualmente um módulo como tendo registros (após criação de novo registro).
   */
  const markModuleWithRecords = (moduleRoute: string) => {
    setModulesWithRecords(prev => {
      const next = new Set(prev);
      next.add(moduleRoute);

      // Atualizar cache
      if (user) {
        try {
          localStorage.setItem(
            `module_records_${user.id}`,
            JSON.stringify({ routes: Array.from(next), ts: Date.now() })
          );
        } catch { /* ignore */ }
      }

      return next;
    });
  };

  return { hasRecordsInModule, markModuleWithRecords, isLoading };
};
