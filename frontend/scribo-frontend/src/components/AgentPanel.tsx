import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export const AgentPanel = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI writing assistant. I can help you improve your content, suggest edits, or answer questions about your document.',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you said: "${input}". How can I help you improve this section?`,
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-neutral-800 border border-gray-500`}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg ">
            <Bot className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <h3 className="font-medium">AI Assistant</h3>
            <p className="text-xs text-white">Ready to help</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 border-t border-gray-500">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'agent' && (
                <div className="p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-orange-500" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  message.sender === 'user'
                    ? 'bg-blue'
                    : 'bg-gray-500'
                }`}
              >
                {message.content}
              </div>
              {message.sender === 'user' && (
                <div className="p-1.5 rounded-full bg-secondary h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-500">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or request help..."
            className="flex-1 border border-gray-500 focus:border-primary focus:ring-0"
          />
          <Button 
            onClick={handleSendMessage}
            size="sm"
            className="px-3 bg-orange-500"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};