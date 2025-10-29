import type { AgentMessage } from "./types";

export default async function agentMessage(
  payload: AgentMessage,
  documentId: string,
  sectionId: string,
): Promise<{ response: AgentMessage }> {
  const response = await fetch(`/api/agent/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      document_id: documentId,
      section_id: sectionId,
      role: payload.role,
      content: payload.content,
      thread_id: payload.thread_id,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send agent message");
  }

  return response.json();
}
