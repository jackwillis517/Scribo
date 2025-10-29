import type { AgentMessage, MessageRequest } from "./types";

export default async function getMessagesById(
  payload: MessageRequest,
): Promise<{ messages: AgentMessage[] }> {
  const response = await fetch(`/api/agent/getMessagesById`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to get messages");
  }

  return response.json();
}
