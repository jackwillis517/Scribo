import { DocumentList } from "../components/DocumentList";
import { mockDocuments } from "@/data/mockData";
import { createFileRoute } from '@tanstack/react-router'

const handleAddDocument = () => {}

const Index = () => {
    return (
      <>
        <DocumentList documents={mockDocuments} onAddDocument={handleAddDocument} />
      </>
  );
} 

export const Route = createFileRoute("/")({
  component: Index,
})


