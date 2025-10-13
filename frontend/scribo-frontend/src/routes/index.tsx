import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router'
import { DocumentList } from "@/components/DocumentList";
import { CreateDocumentForm } from '@/components/CreateDocumentForm';
import { useAuth } from '@/auth/useAuth';

const Index = () => {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (!user) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome to Scribo</h1>
      <p className="text-lg text-gray-600">Please log in to access your documents.</p>
    </div>;
  }

  const handleAddDocument = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateDocument = async (data: {
    title: string;
    description?: string;
    defaultSectionName?: string;
  }) => {
    console.log("Creating document with data:", data);
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
}

export const Route = createFileRoute("/")({
  component: Index,
})


