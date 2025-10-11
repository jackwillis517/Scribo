export default async function deleteSection(id: string) {
  const response = await fetch(`/api/sections/deleteSection/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete section");
  }

  return response.json();
}
