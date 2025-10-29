import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import type { AgentMessage } from "@/api/types";
import getMessagesById from "@/api/getMessagesById";
import agentMessage from "@/api/agentMessage";

const DEFAULT_MESSAGE: AgentMessage = {
  content:
    "Hello! I'm your AI writing assistant. I can help you improve your content, suggest edits, or answer questions about this section or document.",
  role: "assistant",
};

export const AgentPanel = ({
  documentId,
  sectionId,
}: {
  documentId: string;
  sectionId: string;
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const result = await getMessagesById({
          document_id: documentId,
          section_id: sectionId,
        });

        if (result.messages && result.messages.length > 0) {
          setMessages(result.messages);
        } else {
          setMessages([DEFAULT_MESSAGE]);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([DEFAULT_MESSAGE]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [documentId, sectionId]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AgentMessage = {
      content: input,
      role: "user",
    };

    // Add user message to UI immediately
    setMessages((prev) => {
      // Remove default message if it's the only message
      if (prev.length === 1 && prev[0].content === DEFAULT_MESSAGE.content) {
        return [userMessage];
      }
      return [...prev, userMessage];
    });
    setInput("");

    try {
      // Send message to API
      const result = await agentMessage(userMessage, documentId, sectionId);

      // Add assistant response to UI
      const assistantMessage: AgentMessage = {
        content: result.response.content,
        role: "assistant",
        thread_id: result.response.thread_id,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Add error message to UI
      const errorMessage: AgentMessage = {
        content: "Sorry, I couldn't process your message. Please try again.",
        role: "assistant",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

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
      </ScrollArea>

      <div className="p-4 border-t border-gray-500">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or request help..."
            className="flex-1 border border-gray-500 text-white focus:ring-0 focus:border-orange-500"
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
