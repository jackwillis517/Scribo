export default async function getSectionById(id: string) {
    const response = await fetch(`/api/sections/readSection`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "id": id
        }),
        credentials: "include", 
    });

    if (!response.ok) {
        throw new Error("Failed to get documents");
    }

    const data = await response.json();
    return data;
}