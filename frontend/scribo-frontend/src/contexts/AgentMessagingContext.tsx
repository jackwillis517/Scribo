import { useState, useEffect, useRef } from "react";
import type { AgentMessage } from "@/api/types";
import getMessagesById from "@/api/getMessagesById";
import agentMessage from "@/api/agentMessage";
import { AgentMessagingContext } from "./agentMessagingContextDefinition";

const DEFAULT_MESSAGE: AgentMessage = {
  content:
    "Hello! I'm your AI writing assistant. I can help you improve your content, suggest edits, or answer questions about this section or document.",
  role: "assistant",
};

export const AgentMessagingProvider = ({
  children,
  documentId,
  sectionId,
}: {
  children: React.ReactNode;
  documentId: string;
  sectionId: string;
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
          setThreadId(
            result.messages[0].thread_id
              ? result.messages[0].thread_id
              : undefined,
          );
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

  const handleSendMessage = async (customContent?: string) => {
    const messageContent = customContent || input.trim();
    if (!messageContent) return;

    const userMessage: AgentMessage = {
      content: messageContent,
      role: "user",
      thread_id: threadId ? threadId : undefined,
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
      setThreadId(result.response.thread_id || undefined);
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

  return (
    <AgentMessagingContext.Provider
      value={{
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        threadId,
        handleSendMessage,
        scrollAreaRef,
      }}
    >
      {children}
    </AgentMessagingContext.Provider>
  );
};
