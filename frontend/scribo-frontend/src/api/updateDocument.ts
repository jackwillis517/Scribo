import type { Document } from "./types";

export default async function updateDocument(document: Document) {
  const response = await fetch(`/api/documents/updateDocument`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error("Failed to update document");
  }

  return response.json();
}
