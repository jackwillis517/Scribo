export default async function postLogin(token: string) {
  const response = await fetch(`http://localhost:8081/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_token: token,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to login");
  }

  const data = await response.json();
  return data;
}
