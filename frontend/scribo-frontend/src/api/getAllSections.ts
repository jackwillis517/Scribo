export default async function getAllSections() {
  const response = await fetch(`/api/sections/getAllSections`, {
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