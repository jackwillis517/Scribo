import { createContext } from "react";
import type { AgentMessage } from "@/api/types";

export interface AgentMessagingContextType {
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  threadId: string | undefined;
  handleSendMessage: (customContent?: string) => Promise<void>;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
}

export const AgentMessagingContext = createContext<
  AgentMessagingContextType | undefined
>(undefined);
