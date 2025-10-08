export default async function invalidateUser() {
  const response = await fetch(`/api/user/invalidateUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user data");
  }

  return
}