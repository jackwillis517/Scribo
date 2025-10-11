export default async function deleteDocument(id: string) {
  const response = await fetch(`/api/documents/deleteDocument/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }

  return response.json();
}
