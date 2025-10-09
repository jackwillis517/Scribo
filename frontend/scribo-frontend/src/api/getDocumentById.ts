export default async function getDocumentById(id: string) {
    const response = await fetch(`/api/documents/readDocument`, {
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