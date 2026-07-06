import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useSendMessage } from '@workspace/api-client-react';
import type { ChatMessage } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Trash2, Loader2, AlertCircle, Cpu, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useLocalStorage } from 'usehooks-ts';

type UIMessage = ChatMessage & { tokens?: number };

const SYSTEM_PROMPT: UIMessage = {
  role: 'system',
  content: 'أنت خبير برمجة محترف. أجب بكود دقيق مع شرح.'
};

export default function Chat() {
  const { apiKey, addTokens } = useAppContext();
  const { toast } = useToast();
  
  const [messages, setMessages] = useLocalStorage<UIMessage[]>('chat_history_ui', [SYSTEM_PROMPT]);
  const [input, setInput] = useState('');
  
  const sendMessageMutation = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollableNode = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableNode) {
        scrollableNode.scrollTop = scrollableNode.scrollHeight;
      }
    }
  }, [messages, sendMessageMutation.isPending]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      toast({
        title: 'Missing API Key',
        description: 'Please set your NaraRouter API key in settings.',
        variant: 'destructive',
      });
      return;
    }

    const userMsg: UIMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');

    // Prepare payload
    const payloadMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    sendMessageMutation.mutate({
      data: {
        apiKey,
        messages: payloadMessages
      }
    }, {
      onSuccess: (data) => {
        addTokens(data.tokensUsed);
        setMessages([...newMessages, { role: 'assistant', content: data.reply, tokens: data.tokensUsed }]);
      },
      onError: (error: any) => {
        toast({
          title: 'Error sending message',
          description: error?.response?.data?.error || error.message || 'An unknown error occurred.',
          variant: 'destructive'
        });
      }
    });
  };

  const clearHistory = () => {
    setMessages([SYSTEM_PROMPT]);
  };

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6" dir="auto">
      <div className="flex items-center justify-between mb-4" dir="ltr">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Code Assistant</h1>
          <p className="text-sm text-muted-foreground">Expert coding help with Arabic support.</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card shadow-sm" dir="ltr">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto pb-4" dir="auto">
            {messages.filter(m => m.role !== 'system').length === 0 ? (
              <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Bot className="w-12 h-12" />
                <p>Hello! I am your coding assistant. How can I help you today?</p>
                <p dir="rtl">مرحباً! أنا المساعد البرمجي. كيف يمكنني مساعدتك اليوم؟</p>
              </div>
            ) : (
              messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                  )}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className={cn(
                      "px-4 py-3 rounded-lg text-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 border border-border"
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-1">
                      {msg.role === 'assistant' && msg.tokens && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1" dir="ltr">
                          <Cpu className="w-3 h-3" />
                          {msg.tokens} tokens
                        </div>
                      )}
                      <button
                        onClick={() => copyMessage(msg.content, idx)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        title="Copy message"
                      >
                        {copiedIdx === idx
                          ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
                          : <><Copy className="w-3 h-3" /><span>Copy</span></>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {sendMessageMutation.isPending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border" dir="ltr">
          <div className="max-w-4xl mx-auto relative flex items-center" dir="auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a coding question... (Arabic supported)"
              className="px-4 pr-14 py-6 bg-muted/50 border-border focus-visible:ring-primary shadow-sm text-base"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md transition-all h-8 w-8"
              disabled={!input.trim() || sendMessageMutation.isPending}
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-xs text-muted-foreground flex justify-between" dir="ltr">
            <span>Press Enter to send</span>
            {!apiKey && (
              <span className="text-destructive flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                API Key required
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
