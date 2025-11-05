import { useContext } from "react";
import { AgentMessagingContext } from "@/contexts/agentMessagingContextDefinition";

export const useAgentMessaging = () => {
  const context = useContext(AgentMessagingContext);
  if (context === undefined) {
    throw new Error(
      "useAgentMessaging must be used within an AgentMessagingProvider",
    );
  }
  return context;
};
