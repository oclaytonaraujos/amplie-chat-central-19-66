import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Webhook, 
  TestTube, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Send,
  Database,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EvolutionApiConfigTab from './EvolutionApiConfigTab';

interface WebhookConfig {
  id: string;
  nome: string;
  tipo: 'evolution' | 'n8n' | 'whatsapp' | 'custom';
  url: string;
  status: 'ativo' | 'inativo' | 'erro';
  ultima_chamada?: string;
  total_chamadas: number;
  chamadas_sucesso: number;
  chamadas_erro: number;
  created_at: string;
}

interface LogWebhook {
  id: string;
  webhook_id: string;
  webhook_nome: string;
  metodo: string;
  status_code: number;
  response_time: number;
  payload: any;
  response: any;
  erro?: string;
  timestamp: string;
}

interface TesteWebhook {
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  payload: string;
}

export default function IntegracoesCentralizadas() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<LogWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [testando, setTestando] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [testeDialogOpen, setTesteDialogOpen] = useState(false);
  const [webhookParaTeste, setWebhookParaTeste] = useState<WebhookConfig | null>(null);

  const { toast } = useToast();

  const [testeConfig, setTesteConfig] = useState<TesteWebhook>({
    metodo: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Amplie-Chat-Test'
    },
    payload: JSON.stringify({
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Teste de webhook do Amplie Chat'
    }, null, 2)
  });

  useEffect(() => {
    loadWebhooks();
    loadLogs();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      
      // Simular dados de webhooks globais do sistema
      const webhooksSimulados: WebhookConfig[] = [
        {
          id: '1',
          nome: 'Evolution API Global',
          tipo: 'evolution',
          url: 'https://evolution-api.com/webhook/global',
          status: 'ativo',
          ultima_chamada: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
          total_chamadas: 1250,
          chamadas_sucesso: 1200,
          chamadas_erro: 50,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          nome: 'N8N Automation Hub',
          tipo: 'n8n',
          url: 'https://n8n.amplie-chat.com/webhook/global-trigger',
          status: 'ativo',
          ultima_chamada: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min atrás
          total_chamadas: 850,
          chamadas_sucesso: 845,
          chamadas_erro: 5,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          nome: 'WhatsApp Business API',
          tipo: 'whatsapp',
          url: 'https://api.whatsapp.com/webhook/amplie-chat',
          status: 'erro',
          ultima_chamada: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
          total_chamadas: 500,
          chamadas_sucesso: 450,
          chamadas_erro: 50,
          created_at: new Date().toISOString()
        }
      ];

      setWebhooks(webhooksSimulados);
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      // Simular logs de webhooks
      const logsSimulados: LogWebhook[] = [
        {
          id: '1',
          webhook_id: '1',
          webhook_nome: 'Evolution API Global',
          metodo: 'POST',
          status_code: 200,
          response_time: 145,
          payload: { message: 'Nova mensagem recebida', from: '+5511999999999' },
          response: { success: true, message_id: 'msg_123' },
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: '2',
          webhook_id: '2',
          webhook_nome: 'N8N Automation Hub',
          metodo: 'POST',
          status_code: 200,
          response_time: 89,
          payload: { trigger: 'customer_message', data: { customer_id: '456' } },
          response: { processed: true, workflow_id: 'wf_789' },
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
        },
        {
          id: '3',
          webhook_id: '3',
          webhook_nome: 'WhatsApp Business API',
          metodo: 'POST',
          status_code: 500,
          response_time: 5000,
          payload: { message: 'Teste de conexão' },
          response: null,
          erro: 'Timeout: Webhook não responde',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ];

      setLogs(logsSimulados);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const testarWebhook = async () => {
    if (!webhookParaTeste) return;

    setTestando(true);
    
    try {
      const headers = new Headers();
      Object.entries(testeConfig.headers).forEach(([key, value]) => {
        if (value.trim()) {
          headers.append(key, value);
        }
      });

      const requestConfig: RequestInit = {
        method: testeConfig.metodo,
        headers,
        mode: 'no-cors' // Para evitar problemas de CORS em testes
      };

      if (testeConfig.metodo !== 'GET' && testeConfig.payload.trim()) {
        requestConfig.body = testeConfig.payload;
      }

      const startTime = Date.now();
      
      try {
        const response = await fetch(webhookParaTeste.url, requestConfig);
        const endTime = Date.now();
        
        // Como estamos usando no-cors, não conseguimos ler a resposta real
        // Mas podemos simular um sucesso para fins de demonstração
        const novoLog: LogWebhook = {
          id: Date.now().toString(),
          webhook_id: webhookParaTeste.id,
          webhook_nome: webhookParaTeste.nome,
          metodo: testeConfig.metodo,
          status_code: 200, // Simulado
          response_time: endTime - startTime,
          payload: JSON.parse(testeConfig.payload || '{}'),
          response: { status: 'Test request sent successfully' },
          timestamp: new Date().toISOString()
        };

        setLogs(prev => [novoLog, ...prev]);

        toast({
          title: "Teste Enviado",
          description: `Requisição enviada para ${webhookParaTeste.nome}. Verifique os logs do webhook de destino para confirmar o recebimento.`,
        });
      } catch (fetchError) {
        const endTime = Date.now();
        
        const novoLogErro: LogWebhook = {
          id: Date.now().toString(),
          webhook_id: webhookParaTeste.id,
          webhook_nome: webhookParaTeste.nome,
          metodo: testeConfig.metodo,
          status_code: 0,
          response_time: endTime - startTime,
          payload: JSON.parse(testeConfig.payload || '{}'),
          response: null,
          erro: (fetchError as Error).message,
          timestamp: new Date().toISOString()
        };

        setLogs(prev => [novoLogErro, ...prev]);

        toast({
          title: "Erro no Teste",
          description: `Erro ao conectar com ${webhookParaTeste.nome}: ${(fetchError as Error).message}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no teste de webhook:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao executar teste",
        variant: "destructive",
      });
    } finally {
      setTestando(false);
      setTesteDialogOpen(false);
    }
  };

  const abrirTesteWebhook = (webhook: WebhookConfig) => {
    setWebhookParaTeste(webhook);
    setTesteConfig({
      metodo: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Amplie-Chat-Test',
        'X-Test-Source': 'Admin-Panel'
      },
        payload: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          webhook_name: webhook.nome,
          message: 'Teste de webhook do painel administrativo'
        }, null, 2)
    });
    setTesteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
      case 'erro':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const configs = {
      evolution: { color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
      n8n: { color: 'bg-purple-100 text-purple-800', icon: Activity },
      whatsapp: { color: 'bg-green-100 text-green-800', icon: MessageSquare },
      custom: { color: 'bg-gray-100 text-gray-800', icon: Webhook }
    };
    
    const config = configs[tipo as keyof typeof configs] || configs.custom;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {tipo.toUpperCase()}
      </Badge>
    );
  };

  const webhooksFiltrados = webhooks.filter(webhook => {
    const matchTipo = !filtroTipo || filtroTipo === 'all' || webhook.tipo === filtroTipo;
    const matchStatus = !filtroStatus || filtroStatus === 'all' || webhook.status === filtroStatus;
    return matchTipo && matchStatus;
  });

  const logsFiltrados = selectedWebhook && selectedWebhook !== 'all'
    ? logs.filter(log => log.webhook_id === selectedWebhook)
    : logs;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="evolution-api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="evolution-api">Evolution API</TabsTrigger>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="logs">Logs Detalhados</TabsTrigger>
          <TabsTrigger value="teste">Testador de Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution-api">
          <EvolutionApiConfigTab />
        </TabsContent>

        <TabsContent value="visao-geral">
          <div className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Tipo de Integração</Label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="evolution">Evolution API</SelectItem>
                        <SelectItem value="n8n">N8N</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="custom">Customizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Status</Label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="erro">Com Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadWebhooks} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid de Webhooks */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {webhooksFiltrados.map((webhook) => (
                <Card key={webhook.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{webhook.nome}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => abrirTesteWebhook(webhook)}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {getTipoBadge(webhook.tipo)}
                      {getStatusBadge(webhook.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">URL</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded truncate">
                          {webhook.url}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Total de Chamadas</Label>
                          <p className="font-bold">{webhook.total_chamadas.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Taxa de Sucesso</Label>
                          <p className="font-bold text-green-600">
                            {((webhook.chamadas_sucesso / webhook.total_chamadas) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {webhook.ultima_chamada && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Última Chamada</Label>
                          <p className="text-sm">
                            {format(new Date(webhook.ultima_chamada), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs Detalhados de Webhooks</CardTitle>
                  <CardDescription>
                    Histórico completo de chamadas para todos os webhooks
                  </CardDescription>
                </div>
                <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filtrar por webhook" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os webhooks</SelectItem>
                    {webhooks.map(webhook => (
                      <SelectItem key={webhook.id} value={webhook.id}>
                        {webhook.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo (ms)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsFiltrados.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.timestamp), 'dd/MM HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{log.webhook_nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.metodo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.status_code >= 200 && log.status_code < 300 ? "default" : "destructive"}
                        >
                          {log.status_code || 'ERRO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={log.response_time > 1000 ? 'text-red-600' : 'text-green-600'}>
                          {log.response_time}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Database className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Chamada</DialogTitle>
                              <DialogDescription>
                                Informações completas sobre a requisição e resposta
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Payload Enviado</Label>
                                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>
                              </div>
                              {log.response && (
                                <div>
                                  <Label>Resposta Recebida</Label>
                                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                    {JSON.stringify(log.response, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.erro && (
                                <div>
                                  <Label>Erro</Label>
                                  <p className="bg-red-50 text-red-800 p-3 rounded text-sm">
                                    {log.erro}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teste">
          <Card>
            <CardHeader>
              <CardTitle>Testador de Webhooks</CardTitle>
              <CardDescription>
                Teste qualquer webhook diretamente do painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id} className="relative">
                    <CardHeader>
                      <CardTitle className="text-lg">{webhook.nome}</CardTitle>
                      <div className="flex gap-2">
                        {getTipoBadge(webhook.tipo)}
                        {getStatusBadge(webhook.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">URL</Label>
                          <p className="text-sm font-mono bg-muted p-2 rounded truncate">
                            {webhook.url}
                          </p>
                        </div>
                        <Button 
                          onClick={() => abrirTesteWebhook(webhook)}
                          className="w-full"
                          variant="outline"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Testar Webhook
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Teste */}
      <Dialog open={testeDialogOpen} onOpenChange={setTesteDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Testar Webhook: {webhookParaTeste?.nome}</DialogTitle>
            <DialogDescription>
              Configure e execute um teste personalizado para este webhook
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label>URL de Destino</Label>
              <Input value={webhookParaTeste?.url || ''} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Método HTTP</Label>
                <Select 
                  value={testeConfig.metodo} 
                  onValueChange={(value) => setTesteConfig({...testeConfig, metodo: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Headers (JSON)</Label>
              <Textarea
                value={JSON.stringify(testeConfig.headers, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    setTesteConfig({...testeConfig, headers});
                  } catch (error) {
                    // Ignore JSON parse errors while typing
                  }
                }}
                className="font-mono text-sm"
                rows={4}
              />
            </div>

            {testeConfig.metodo !== 'GET' && (
              <div>
                <Label>Payload (JSON)</Label>
                <Textarea
                  value={testeConfig.payload}
                  onChange={(e) => setTesteConfig({...testeConfig, payload: e.target.value})}
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setTesteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={testarWebhook}
                disabled={testando}
              >
                {testando ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Teste
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}