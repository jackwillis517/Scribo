import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { useAgentMessaging } from "@/hooks/useAgentMessaging";

export const AgentPanel = () => {
  const {
    messages,
    input,
    setInput,
    isLoading,
    handleSendMessage,
    scrollAreaRef,
  } = useAgentMessaging();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]",
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };

    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-neutral-800 border border-gray-500`}
    >
      <div className="p-4 flex-shrink-0">
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

      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 min-h-0 border-t border-gray-500"
      >
        <div className="p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">Loading messages...</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-orange-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.role === "user" ? "bg-blue" : "bg-gray-500"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="p-1.5 rounded-full bg-secondary h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-500 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or request help..."
            className="flex-1 border border-gray-500 text-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-orange-500"
          />
          <Button
            onClick={() => handleSendMessage()}
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
