import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentList } from "@/components/DocumentList";
import { CreateDocumentForm } from "@/components/CreateDocumentForm";
import { useAuth } from "@/auth/useAuth";
import createDocument from "@/api/createDocument";
import createSection from "@/api/createSection";

const Index = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Welcome to Scribo</h1>
        <p className="text-lg text-gray-600">
          Please log in to access your documents.
        </p>
      </div>
    );
  }

  const handleAddDocument = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateDocument = async (data: {
    title: string;
    description?: string;
  }) => {
    const document = {
      user_id: user.id,
      title: data.title,
      description: data.description || "No description provided.",
      length: 0,
      num_words: 0,
      num_sections: 1,
    };

    const uploadedDocument = await createDocument(document);

    const document_id = uploadedDocument["document"]["id"];

    const default_section = {
      document_id: document_id,
      title: "Default Section Name",
      content: "Words. Really good ones. The best words.",
      summary: "Default summary.",
      metadata: {},
      length: 0,
      num_words: 0,
    };

    await createSection(default_section);

    // Invalidate the documents list query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["documents-list"] });
  };

  return (
    <>
      <DocumentList onAddDocument={handleAddDocument} />
      <CreateDocumentForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateDocument}
      />
    </>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
