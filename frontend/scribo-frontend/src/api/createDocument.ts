import type { Document } from "./types";

export default async function createDocument(document: Document) {
  const response = await fetch(`/api/documents/createDocument`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error("Failed to create document");
  }

  return response.json();
}
