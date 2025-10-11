import type { AgentMessage } from "./types";

export default async function agentMessage(payload: AgentMessage) {
  const response = await fetch(`/api/agent/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to send agent message");
  }

  return response.json();
}
