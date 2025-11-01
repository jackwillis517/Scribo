export default async function getSectionsForDocument(documentId: string) {
  const response = await fetch(`/api/sections/getSectionsForDocument`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ id: documentId }),
  });

  if (!response.ok) {
    throw new Error("Failed to get documents");
  }

  const data = await response.json();
  return data;
}
