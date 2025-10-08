
import { createFileRoute } from '@tanstack/react-router'
import { DocumentList } from "../components/DocumentList";
// import { mockDocuments } from "@/data/mockData";
import { useAuth } from '@/auth/useAuth';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome to Scribo</h1>
      <p className="text-lg text-gray-600">Please log in to access your documents.</p>
    </div>;
  }

  return <DocumentList />
} 

export const Route = createFileRoute("/")({
  component: Index,
})


