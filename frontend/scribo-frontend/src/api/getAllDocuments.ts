export default async function getAllDocuments() {
  const response = await fetch(`/api/documents/getAllDocuments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", 
  });

  if (!response.ok) {
    throw new Error("Failed to get documents");
  }

  const data = await response.json();
  return data;
}