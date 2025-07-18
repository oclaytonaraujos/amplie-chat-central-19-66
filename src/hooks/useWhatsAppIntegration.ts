import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface WhatsAppConnection {
  id: string;
  nome: string;
  numero: string;
  status: string;
  ativo: boolean;
  qr_code?: string;
  ultimo_ping?: string;
}

interface WhatsAppConfig {
  instance_name: string;
  webhook_url?: string;
  ativo: boolean;
  status?: string;
  qr_code?: string;
  last_connected_at?: string;
}

export function useWhatsAppIntegration() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConnections = useCallback(async () => {
    try {
      logger.info('Carregando conexões WhatsApp', {
        component: 'useWhatsAppIntegration'
      });

      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConnections((data || []).map(conn => ({
        id: conn.id,
        nome: conn.nome,
        numero: conn.numero,
        status: conn.status || 'desconectado',
        ativo: conn.ativo,
        qr_code: conn.qr_code,
        ultimo_ping: conn.ultimo_ping
      })));
    } catch (error) {
      logger.error('Erro ao carregar conexões WhatsApp', {
        component: 'useWhatsAppIntegration'
      }, error as Error);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setConfig({
          instance_name: data.instance_name,
          webhook_url: data.webhook_url,
          ativo: data.ativo,
          status: data.status,
          qr_code: data.qr_code,
          last_connected_at: data.last_connected_at
        });
      }
    } catch (error) {
      logger.error('Erro ao carregar configuração Evolution API', {
        component: 'useWhatsAppIntegration'
      }, error as Error);
    }
  }, []);

  const sincronizarConexoes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get global config for API access
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('api_key, server_url')
        .eq('ativo', true)
        .single();

      if (!globalConfig) {
        throw new Error('Configuração global Evolution API não encontrada');
      }
      
      const response = await fetch(`${globalConfig.server_url}/instance/fetchInstances`, {
        headers: {
          'apikey': globalConfig.api_key
        }
      });
      const statusData = await response.json();

      if (!response.ok) {
        throw new Error(`Erro na Evolution API: ${statusData.message}`);
      }

      await loadConnections();
      toast({
        title: "Sincronização concluída",
        description: "Conexões WhatsApp sincronizadas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar as conexões WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadConnections, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadConnections(), loadConfig()]);
      setLoading(false);
    };

    loadData();
  }, [loadConnections, loadConfig]);

  return {
    connections,
    config,
    loading,
    sincronizarConexoes
  };
}