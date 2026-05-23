import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, MessageCircle, Send, Sparkles, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DeceasedInfo, Heir, Madhab } from '@/lib/inheritance';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  caseContext?: {
    deceased?: DeceasedInfo;
    heirs?: Heir[];
    madhab?: Madhab;
  };
}

interface AskAiResponse {
  answer: string;
}

interface QuickQuestion {
  id: string;
  question: string;
  questionAr: string;
  category: string;
}

const FALLBACK_QUESTIONS: QuickQuestion[] = [
  { id: 'q1', question: 'What is Awl?', questionAr: 'ما هو العول؟', category: 'concepts' },
  { id: 'q2', question: 'Explain Hajb', questionAr: 'اشرح الحجب', category: 'concepts' },
  { id: 'q3', question: 'How are debts handled?', questionAr: 'كيف يتم التعامل مع الديون؟', category: 'estate' },
  { id: 'q4', question: 'What are madhab differences?', questionAr: 'ما اختلافات المذاهب؟', category: 'madhabs' },
];

const AIAssistant = ({ caseContext }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>(FALLBACK_QUESTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    api.get<QuickQuestion[]>('/ai/quick-questions')
      .then((response) => setQuickQuestions(response.data))
      .catch(() => setQuickQuestions(FALLBACK_QUESTIONS));
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post<AskAiResponse>('/ai/ask', {
        query: userMsg.content,
        caseId: undefined,
        caseContext,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Warning: ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gold-gradient text-emerald-dark shadow-lg hover:opacity-90 transition-all flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-48px)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="emerald-gradient px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-foreground" />
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Mirath AI Assistant</p>
                <p className="text-xs text-primary-foreground/70">مساعد ميراث الذكي</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <button onClick={() => setIsOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center space-y-4 pt-4">
                <div className="w-12 h-12 mx-auto rounded-full emerald-gradient flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">السلام عليكم!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    I can help with Islamic inheritance rules, explain calculations, and answer your questions.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.slice(0, 4).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => sendMessage(q.question)}
                      className="p-2 text-xs text-left rounded-lg border border-border hover:border-accent/30 hover:bg-accent/5 transition-colors text-foreground"
                    >
                      {q.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full emerald-gradient flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-accent text-accent-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full emerald-gradient flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Islamic inheritance..."
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="gold-gradient text-emerald-dark hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
