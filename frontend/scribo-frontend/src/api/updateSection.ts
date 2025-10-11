import type { Section } from "./types";

export default async function updateSection(section: Section) {
  const response = await fetch(`/api/sections/updateSection`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(section),
  });

  if (!response.ok) {
    throw new Error("Failed to update section");
  }

  return response.json();
}
