import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Bot, User, Loader2, BookOpen, Quote, Sparkles, Trash2, Copy, Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

interface Citation {
  source: string;
  reference: string;
  text: string;
  textAr: string;
}

interface QuickQuestion {
  id: string;
  question: string;
  questionAr: string;
  category: string;
}

interface AIChatAssistantProps {
  caseId?: string;
}

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ caseId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isRtl = language === 'ar';

  useEffect(() => {
    loadQuickQuestions();
    loadChatHistory();
  }, [caseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadQuickQuestions = async () => {
    try {
      const response = await api.get('/ai/quick-questions');
      setQuickQuestions(response.data);
    } catch (error) {
      console.error('Failed to load quick questions:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const url = caseId ? `/ai/history?caseId=${caseId}` : '/ai/history';
      const response = await api.get(url);
      const history = response.data.map((msg: any) => ({
        id: crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/ask', { query, caseId });
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.answer,
        citations: response.data.citations,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const url = caseId ? `/ai/history?caseId=${caseId}` : '/ai/history';
      await api.delete(url);
      setMessages([]);
      toast({
        title: 'History Cleared',
        description: 'Chat history has been cleared',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear history',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-gold/20 shadow-lg h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-emerald-dark/5 to-transparent border-b border-gold/20">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            AI Islamic Assistant
            <span className="text-gold font-arabic text-sm">المساعد الإسلامي الذكي</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-emerald-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Islamic Assistant</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Ask me anything about Islamic inheritance (Faraidh)
                </p>
                <p className="text-xs text-muted-foreground font-arabic mt-1">
                  اسألني أي شيء عن علم الفرائض والمواريث
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'gold-gradient text-emerald-dark'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <Bot className="w-4 h-4 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        
                        {/* Citations */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gold/20">
                            <p className="text-xs font-semibold flex items-center gap-1 mb-1">
                              <BookOpen className="w-3 h-3" />
                              Sources:
                            </p>
                            {message.citations.map((citation, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                                {citation.source}: {citation.reference}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-1 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <User className="w-4 h-4 mt-0.5 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Quick Questions */}
        <div className="border-t border-gold/20 p-3">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="concepts">Concepts</TabsTrigger>
              <TabsTrigger value="heirs">Heirs</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            </TabsList>
            {['basics', 'concepts', 'heirs', 'scenarios'].map((category) => (
              <TabsContent key={category} value={category} className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {quickQuestions
                    .filter(q => q.category === category)
                    .map((q) => (
                      <Button
                        key={q.id}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(isRtl ? q.questionAr : q.question)}
                        className="text-xs border-gold/30 hover:bg-gold/10"
                      >
                        {isRtl ? q.questionAr : q.question}
                      </Button>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Input Area */}
        <div className="border-t border-gold/20 p-3 flex gap-2">
          <Input
            placeholder={isRtl ? "اسأل عن المواريث..." : "Ask about inheritance..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
            className="flex-1 border-gold/20"
          />
          <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} variant="gold">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};