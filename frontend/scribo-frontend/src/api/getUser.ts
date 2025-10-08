export default async function getUser() {
  const response = await fetch(`/api/user/getUser`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication if needed
  });

  if (!response.ok) {
    throw new Error("Failed to get user data");
  }

  const data = await response.json();
  return data;
}
