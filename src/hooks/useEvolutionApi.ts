import { useState, useCallback, useEffect } from 'react';
import { EvolutionApiService } from '@/services/evolution-api';
import { EvolutionApiConfig, EvolutionApiStatus } from '@/types/evolution-api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseEvolutionApiReturn {
  evolutionApi: EvolutionApiService | null;
  status: EvolutionApiStatus;
  isConfigured: boolean;
  config: EvolutionApiConfig | null;
  loading: boolean;
  conectando: boolean;
  configure: (config: EvolutionApiConfig) => void;
  sendMessage: (phone: string, message: string) => Promise<boolean>;
  sendTextMessage: (phone: string, message: string) => Promise<boolean>;
  sendMediaMessage: (phone: string, mediaUrl: string, mediaType: string, caption?: string, fileName?: string) => Promise<boolean>;
  sendButtonMessage: (phone: string, text: string, buttons: Array<{ id: string; text: string }>, footer?: string) => Promise<boolean>;
  sendListMessage: (
    phone: string, 
    title: string, 
    description: string, 
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    footerText?: string
  ) => Promise<boolean>;
  sendImageMessage: (phone: string, imageUrl: string, caption?: string) => Promise<boolean>;
  sendDocumentMessage: (phone: string, documentUrl: string, fileName: string) => Promise<boolean>;
  sendAudioMessage: (phone: string, audioUrl: string) => Promise<boolean>;
  sendVideoMessage: (phone: string, videoUrl: string, caption?: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  verificarStatus: () => Promise<any>;
  getQRCode: () => Promise<string | null>;
  obterQRCode: () => Promise<any>;
  createInstance: () => Promise<boolean>;
  connectInstance: () => Promise<boolean>;
  restartInstance: () => Promise<boolean>;
  logoutInstance: () => Promise<boolean>;
  setWebhook: (webhookUrl: string, events?: string[]) => Promise<boolean>;
  configurarWebhook: () => Promise<boolean>;
  disconnect: () => void;
}

export function useEvolutionApi(): UseEvolutionApiReturn {
  const [evolutionApi, setEvolutionApi] = useState<EvolutionApiService | null>(null);
  const [config, setConfig] = useState<EvolutionApiConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [status, setStatus] = useState<EvolutionApiStatus>({
    connected: false,
    instanceStatus: 'disconnected',
    lastCheck: null,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  // Carregar configuração do banco de dados
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Get global config for API key and server URL
        const { data: globalConfig } = await supabase
          .from('evolution_api_global_config')
          .select('api_key, server_url')
          .eq('ativo', true)
          .single();

        if (globalConfig) {
          const evolutionConfig: EvolutionApiConfig = {
            apiKey: globalConfig.api_key,
            serverUrl: globalConfig.server_url,
            instanceName: data.instance_name,
            webhookUrl: data.webhook_url,
            webhookEvents: data.webhook_events
          };
          setConfig(evolutionConfig);
          configure(evolutionConfig);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração Evolution API:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar configuração ao inicializar
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const configure = useCallback((config: EvolutionApiConfig) => {
    console.log('Configurando Evolution API:', config);
    
    const evolutionApiService = new EvolutionApiService(config);
    setEvolutionApi(evolutionApiService);
    setConfig(config);
    setIsConfigured(true);
    
    // Verificar status inicial
    checkStatusInternal(evolutionApiService);
  }, []);

  const checkStatusInternal = async (service: EvolutionApiService) => {
    try {
      const statusResponse = await service.getInstanceStatus();
      console.log('Status Evolution API:', statusResponse);
      
      const connected = statusResponse.data?.instance?.state === 'open';
      
      setStatus({
        connected,
        instanceStatus: statusResponse.data?.instance?.state || 'unknown',
        lastCheck: new Date(),
      });
    } catch (error) {
      console.error('Erro ao verificar status Evolution API:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        instanceStatus: 'error',
        lastCheck: new Date(),
      }));
    }
  };

  const checkStatus = useCallback(async () => {
    if (!evolutionApi) return;
    await checkStatusInternal(evolutionApi);
  }, [evolutionApi]);

  const verificarStatus = useCallback(async () => {
    if (!evolutionApi) return { value: false, status: 'disconnected' };
    
    try {
      const response = await evolutionApi.getInstanceStatus();
      return {
        value: response.data?.instance?.state === 'open',
        status: response.data?.instance?.state || 'disconnected'
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { value: false, status: 'error' };
    }
  }, [evolutionApi]);

  const obterQRCode = useCallback(async () => {
    if (!evolutionApi) return { qrcode: null };
    
    try {
      setConectando(true);
      const response = await evolutionApi.getQRCode();
      return {
        qrcode: response.data?.qrcode || response.qrcode || null
      };
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return { qrcode: null };
    } finally {
      setConectando(false);
    }
  }, [evolutionApi]);

  const configurarWebhook = useCallback(async (): Promise<boolean> => {
    if (!evolutionApi || !config?.webhookUrl) return false;

    try {
      const response = await evolutionApi.setWebhook(config.webhookUrl, config.webhookEvents);
      return !!(response.success || response.webhook);
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      return false;
    }
  }, [evolutionApi, config]);

  const sendTextMessage = useCallback(async (phone: string, message: string): Promise<boolean> => {
    return sendMessage(phone, message);
  }, []);

  const sendMediaMessage = useCallback(async (phone: string, mediaUrl: string, mediaType: string, caption?: string, fileName?: string): Promise<boolean> => {
    if (!evolutionApi) return false;

    try {
      let response;
      switch (mediaType) {
        case 'image':
          response = await evolutionApi.sendImageMessage(phone, mediaUrl, caption);
          break;
        case 'document':
          response = await evolutionApi.sendDocumentMessage(phone, mediaUrl, fileName || 'document');
          break;
        case 'audio':
          response = await evolutionApi.sendAudioMessage(phone, mediaUrl);
          break;
        case 'video':
          response = await evolutionApi.sendVideoMessage(phone, mediaUrl, caption);
          break;
        default:
          return false;
      }
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
      return false;
    }
  }, [evolutionApi]);

  const sendMessage = useCallback(async (phone: string, message: string): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendTextMessage(phone, message);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const sendButtonMessage = useCallback(async (
    phone: string, 
    text: string, 
    buttons: Array<{ id: string; text: string }>, 
    footer?: string
  ): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendButtonMessage(phone, text, buttons, footer);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar mensagem com botões:', error);
      toast({
        title: "Erro ao enviar botões",
        description: "Não foi possível enviar a mensagem com botões via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const sendListMessage = useCallback(async (
    phone: string, 
    title: string, 
    description: string, 
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    footerText?: string
  ): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendListMessage(phone, title, description, buttonText, sections, footerText);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar lista:', error);
      toast({
        title: "Erro ao enviar lista",
        description: "Não foi possível enviar a mensagem com lista via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const sendImageMessage = useCallback(async (phone: string, imageUrl: string, caption?: string): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendImageMessage(phone, imageUrl, caption);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível enviar a imagem via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const sendDocumentMessage = useCallback(async (phone: string, documentUrl: string, fileName: string): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendDocumentMessage(phone, documentUrl, fileName);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast({
        title: "Erro ao enviar documento",
        description: "Não foi possível enviar o documento via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const sendAudioMessage = useCallback(async (phone: string, audioUrl: string): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendAudioMessage(phone, audioUrl);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      toast({
        title: "Erro ao enviar áudio",
        description: "Não foi possível enviar o áudio via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const sendVideoMessage = useCallback(async (phone: string, videoUrl: string, caption?: string): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendVideoMessage(phone, videoUrl, caption);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar vídeo:', error);
      toast({
        title: "Erro ao enviar vídeo",
        description: "Não foi possível enviar o vídeo via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const getQRCode = useCallback(async (): Promise<string | null> => {
    if (!evolutionApi) return null;

    try {
      const response = await evolutionApi.getQRCode();
      return response.data?.qrcode || response.qrcode || null;
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return null;
    }
  }, [evolutionApi]);

  const createInstance = useCallback(async (): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.createInstance();
      if (response.success || response.instance) {
        toast({
          title: "Instância criada",
          description: "Instância Evolution API criada com sucesso",
        });
        await checkStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: "Não foi possível criar a instância Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast, checkStatus]);

  const connectInstance = useCallback(async (): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.connectInstance();
      if (response.success || response.instance) {
        toast({
          title: "Conectando instância",
          description: "Iniciando conexão com WhatsApp",
        });
        await checkStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível conectar a instância",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast, checkStatus]);

  const setWebhook = useCallback(async (webhookUrl: string, events?: string[]): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.setWebhook(webhookUrl, events);
      if (response.success || response.webhook) {
        toast({
          title: "Webhook configurado",
          description: "Webhook configurado com sucesso",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      toast({
        title: "Erro ao configurar webhook",
        description: "Não foi possível configurar o webhook",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  const restartInstance = useCallback(async (): Promise<boolean> => {
    if (!evolutionApi) return false;

    try {
      const response = await evolutionApi.restartInstance();
      if (response.success) {
        toast({
          title: "Instância reiniciada",
          description: "Instância reiniciada com sucesso",
        });
        await checkStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error);
      toast({
        title: "Erro ao reiniciar",
        description: "Não foi possível reiniciar a instância",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast, checkStatus]);

  const logoutInstance = useCallback(async (): Promise<boolean> => {
    if (!evolutionApi) return false;

    try {
      const response = await evolutionApi.logoutInstance();
      if (response.success) {
        toast({
          title: "Logout realizado",
          description: "Logout da instância realizado com sucesso",
        });
        await checkStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro ao fazer logout",
        description: "Não foi possível fazer logout da instância",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast, checkStatus]);

  const disconnect = useCallback(() => {
    setEvolutionApi(null);
    setIsConfigured(false);
    setConfig(null);
    setStatus({
      connected: false,
      instanceStatus: 'disconnected',
      lastCheck: null,
    });
    
    toast({
      title: "Evolution API desconectada",
      description: "A integração foi desconectada com sucesso",
    });
  }, [toast]);

  return {
    evolutionApi,
    status,
    isConfigured,
    config,
    loading,
    conectando,
    configure,
    sendMessage,
    sendTextMessage,
    sendMediaMessage,
    sendButtonMessage,
    sendListMessage,
    sendImageMessage,
    sendDocumentMessage,
    sendAudioMessage,
    sendVideoMessage,
    checkStatus,
    verificarStatus,
    getQRCode,
    obterQRCode,
    createInstance,
    connectInstance,
    restartInstance,
    logoutInstance,
    setWebhook,
    configurarWebhook,
    disconnect,
  };
}
