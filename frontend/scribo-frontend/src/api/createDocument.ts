import type { NewDocument } from "./types";

export default async function createDocument(document: NewDocument) {
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
