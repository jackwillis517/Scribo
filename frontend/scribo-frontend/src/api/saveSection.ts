import type { Section } from "./types";

export default async function saveSection(section: Section) {
  const response = await fetch(`/api/agent/saveSection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(section),
  });

  if (!response.ok) {
    throw new Error("Failed to save section");
  }

  return response.json();
}
