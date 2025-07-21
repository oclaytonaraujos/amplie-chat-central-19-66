import { 
  EvolutionApiConfig,
  EvolutionApiMessage, 
  EvolutionApiMediaMessage,
  EvolutionApiButtonMessage,
  EvolutionApiListMessage,
  EvolutionApiWebhookMessage,
  ProcessedMessage,
  EvolutionApiResponse 
} from '@/types/evolution-api';

// Classe para Conexão Global Evolution API - Gerenciamento de Instâncias
class EvolutionApiGlobalService {
  private serverUrl: string;
  private apiKey: string;

  constructor(serverUrl: string, apiKey: string) {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    };
  }

  // CRUD de Instâncias - Operações Globais
  
  // Criar nova instância
  async createInstance(instanceName: string, webhookUrl?: string): Promise<EvolutionApiResponse> {
    console.log('Criando instância Evolution API:', instanceName);
    
    try {
      const payload: any = {
        instanceName,
        token: this.apiKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      };

      // Configurar webhook se fornecido
      if (webhookUrl) {
        payload.webhook = webhookUrl;
        payload.webhook_by_events = false;
        payload.webhook_base64 = false;
        payload.events = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'];
      }

      const response = await fetch(`${this.serverUrl}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta criação instância:', data);
      return data;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  // Listar todas as instâncias
  async fetchInstances(): Promise<EvolutionApiResponse> {
    console.log('Buscando instâncias Evolution API');
    
    try {
      const response = await fetch(`${this.serverUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Instâncias encontradas:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      throw error;
    }
  }

  // Deletar instância
  async deleteInstance(instanceName: string): Promise<EvolutionApiResponse> {
    console.log('Deletando instância:', instanceName);
    
    try {
      const response = await fetch(`${this.serverUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Instância deletada:', data);
      return data;
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      throw error;
    }
  }

  // Obter status de uma instância específica
  async getInstanceStatus(instanceName: string): Promise<EvolutionApiResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Status da instância:', instanceName, data);
      return data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  }

  // Reiniciar instância
  async restartInstance(instanceName: string): Promise<EvolutionApiResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Instância reiniciada:', instanceName, data);
      return data;
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error);
      throw error;
    }
  }

  // Configurar webhook para instância
  async setInstanceWebhook(instanceName: string, webhookUrl: string, events?: string[]): Promise<EvolutionApiResponse> {
    console.log('Configurando webhook para instância:', instanceName, webhookUrl);
    
    try {
      const payload = {
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: events || ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      };

      const response = await fetch(`${this.serverUrl}/webhook/${instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Webhook configurado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw error;
    }
  }
}

// Classe para operações específicas de uma instância
class EvolutionApiService {
  private config: EvolutionApiConfig;
  private baseUrl: string;

  constructor(config: EvolutionApiConfig) {
    this.config = config;
    this.baseUrl = config.serverUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.config.apiKey,
    };
  }

  private getUrl(endpoint: string) {
    return `${this.baseUrl}/${endpoint}/${this.config.instanceName}`;
  }

  // Criar instância
  async createInstance(): Promise<EvolutionApiResponse> {
    console.log('Criando instância Evolution API:', this.config.instanceName);
    
    try {
      const response = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName: this.config.instanceName,
          token: this.config.apiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }),
      });

      const data = await response.json();
      console.log('Resposta criação instância:', data);
      return data;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  // Conectar instância
  async connectInstance(): Promise<EvolutionApiResponse> {
    console.log('Conectando instância:', this.config.instanceName);
    
    try {
      const response = await fetch(this.getUrl('instance/connect'), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Resposta conexão:', data);
      return data;
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      throw error;
    }
  }

  // Obter status da instância
  async getInstanceStatus(): Promise<EvolutionApiResponse> {
    try {
      const response = await fetch(this.getUrl('instance/connectionState'), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Status da instância:', data);
      return data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  }

  // Obter QR Code
  async getQRCode(): Promise<EvolutionApiResponse> {
    try {
      const response = await fetch(this.getUrl('instance/qrcode'), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('QR Code obtido:', data);
      return data;
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      throw error;
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(phone: string, text: string, options?: { delay?: number; linkPreview?: boolean }): Promise<EvolutionApiResponse> {
    console.log('Enviando mensagem via Evolution API:', { phone, text });
    
    try {
      const payload: EvolutionApiMessage = {
        number: phone.replace(/\D/g, ''), // Remove formatação
        text,
        delay: options?.delay || 0,
        linkPreview: options?.linkPreview || false,
      };

      const response = await fetch(this.getUrl('message/sendText'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Enviar mensagem com botões
  async sendButtonMessage(phone: string, text: string, buttons: Array<{ id: string; text: string }>, footer?: string): Promise<EvolutionApiResponse> {
    console.log('Enviando mensagem com botões:', { phone, text, buttons });
    
    try {
      const payload: EvolutionApiButtonMessage = {
        number: phone.replace(/\D/g, ''),
        buttonMessage: {
          text,
          buttons,
          footer,
        },
      };

      const response = await fetch(this.getUrl('message/sendButtons'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta botões Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem com botões:', error);
      throw error;
    }
  }

  // Enviar mensagem com lista
  async sendListMessage(
    phone: string, 
    title: string, 
    description: string, 
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    footerText?: string
  ): Promise<EvolutionApiResponse> {
    console.log('Enviando mensagem com lista:', { phone, title, sections });
    
    try {
      const payload: EvolutionApiListMessage = {
        number: phone.replace(/\D/g, ''),
        listMessage: {
          title,
          description,
          buttonText,
          sections,
          footerText,
        },
      };

      const response = await fetch(this.getUrl('message/sendList'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta lista Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem com lista:', error);
      throw error;
    }
  }

  // Enviar imagem
  async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<EvolutionApiResponse> {
    console.log('Enviando imagem via Evolution API:', { phone, imageUrl, caption });
    
    try {
      const payload: EvolutionApiMediaMessage = {
        number: phone.replace(/\D/g, ''),
        mediatype: 'image',
        media: imageUrl,
        caption: caption || '',
      };

      const response = await fetch(this.getUrl('message/sendMedia'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta imagem Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      throw error;
    }
  }

  // Enviar documento
  async sendDocumentMessage(phone: string, documentUrl: string, fileName: string): Promise<EvolutionApiResponse> {
    console.log('Enviando documento via Evolution API:', { phone, documentUrl, fileName });
    
    try {
      const payload: EvolutionApiMediaMessage = {
        number: phone.replace(/\D/g, ''),
        mediatype: 'document',
        media: documentUrl,
        fileName,
      };

      const response = await fetch(this.getUrl('message/sendMedia'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta documento Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      throw error;
    }
  }

  // Enviar áudio
  async sendAudioMessage(phone: string, audioUrl: string): Promise<EvolutionApiResponse> {
    console.log('Enviando áudio via Evolution API:', { phone, audioUrl });
    
    try {
      const payload: EvolutionApiMediaMessage = {
        number: phone.replace(/\D/g, ''),
        mediatype: 'audio',
        media: audioUrl,
      };

      const response = await fetch(this.getUrl('message/sendMedia'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta áudio Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      throw error;
    }
  }

  // Enviar vídeo
  async sendVideoMessage(phone: string, videoUrl: string, caption?: string): Promise<EvolutionApiResponse> {
    console.log('Enviando vídeo via Evolution API:', { phone, videoUrl, caption });
    
    try {
      const payload: EvolutionApiMediaMessage = {
        number: phone.replace(/\D/g, ''),
        mediatype: 'video',
        media: videoUrl,
        caption: caption || '',
      };

      const response = await fetch(this.getUrl('message/sendMedia'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta vídeo Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar vídeo:', error);
      throw error;
    }
  }

  // Configurar webhook
  async setWebhook(webhookUrl: string, events?: string[]): Promise<EvolutionApiResponse> {
    console.log('Configurando webhook Evolution API:', webhookUrl);
    
    try {
      const payload = {
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: events || ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      };

      const response = await fetch(this.getUrl('webhook'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta webhook Evolution API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw error;
    }
  }

  // Processar mensagem recebida do webhook
  processWebhookMessage(webhookData: EvolutionApiWebhookMessage): ProcessedMessage {
    console.log('Processando mensagem do webhook Evolution API:', webhookData);
    
    const data = webhookData.data;
    const processedMessage: ProcessedMessage = {
      id: data.key.id,
      phone: data.key.remoteJid.replace('@s.whatsapp.net', ''),
      fromMe: data.key.fromMe,
      timestamp: new Date(data.messageTimestamp * 1000),
      senderName: data.pushName || 'Cliente',
      type: 'text',
      content: '',
    };

    // Processar diferentes tipos de mensagem
    if (data.message?.conversation) {
      processedMessage.type = 'text';
      processedMessage.content = data.message.conversation;
    } else if (data.message?.extendedTextMessage) {
      processedMessage.type = 'text';
      processedMessage.content = data.message.extendedTextMessage.text;
    } else if (data.message?.imageMessage) {
      processedMessage.type = 'image';
      processedMessage.content = data.message.imageMessage.caption || '';
      processedMessage.attachment = {
        type: 'image',
        url: data.message.imageMessage.url,
        mimeType: data.message.imageMessage.mimetype,
      };
    } else if (data.message?.documentMessage) {
      processedMessage.type = 'document';
      processedMessage.content = data.message.documentMessage.title || data.message.documentMessage.fileName;
      processedMessage.attachment = {
        type: 'document',
        url: data.message.documentMessage.url,
        fileName: data.message.documentMessage.fileName,
        mimeType: data.message.documentMessage.mimetype,
      };
    } else if (data.message?.audioMessage) {
      processedMessage.type = 'audio';
      processedMessage.attachment = {
        type: 'audio',
        url: data.message.audioMessage.url,
        mimeType: data.message.audioMessage.mimetype,
      };
    } else if (data.message?.videoMessage) {
      processedMessage.type = 'video';
      processedMessage.content = data.message.videoMessage.caption || '';
      processedMessage.attachment = {
        type: 'video',
        url: data.message.videoMessage.url,
        mimeType: data.message.videoMessage.mimetype,
      };
    } else if (data.message?.buttonsResponseMessage) {
      processedMessage.type = 'button_response';
      processedMessage.content = data.message.buttonsResponseMessage.selectedDisplayText;
      processedMessage.buttonResponse = {
        selectedButtonId: data.message.buttonsResponseMessage.selectedButtonId,
        selectedDisplayText: data.message.buttonsResponseMessage.selectedDisplayText,
      };
    } else if (data.message?.listResponseMessage) {
      processedMessage.type = 'list_response';
      processedMessage.content = data.message.listResponseMessage.singleSelectReply.selectedRowId;
      processedMessage.listResponse = {
        selectedRowId: data.message.listResponseMessage.singleSelectReply.selectedRowId,
      };
    }

    return processedMessage;
  }

  // Reiniciar instância
  async restartInstance(): Promise<EvolutionApiResponse> {
    try {
      const response = await fetch(this.getUrl('instance/restart'), {
        method: 'PUT',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Instância reiniciada:', data);
      return data;
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error);
      throw error;
    }
  }

  // Logout da instância
  async logoutInstance(): Promise<EvolutionApiResponse> {
    try {
      const response = await fetch(this.getUrl('instance/logout'), {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      console.log('Logout realizado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }
}

export { EvolutionApiService, EvolutionApiGlobalService };