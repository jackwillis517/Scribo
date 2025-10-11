import type { Section } from "./types";

export default async function createSection(section: Section) {
  const response = await fetch(`/api/sections/createSection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(section),
  });

  if (!response.ok) {
    throw new Error("Failed to create section");
  }

  return response.json();
}
