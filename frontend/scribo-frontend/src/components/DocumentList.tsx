import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Calendar } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@/api/types";
import getAllDocuments from "../api/getAllDocuments";

// import type { Document } from "@/data/mockData";
// type Document = {
//   id: string;
//   title: string;
//   description: string;
//   length: number;
//   num_words: number;
//   num_sections: number;
//   created_at: string;
//   updated_at: string;
// };

export const DocumentList = ({ onAddDocument }: { onAddDocument: () => void }) => {
  const navigate = useNavigate();

  const {isLoading, data } = useQuery({
    queryKey: ['documents-list'],
    queryFn: () => getAllDocuments(),
    staleTime: 30000,
  });

  const handleDocumentClick = (documentId: string) => {
    navigate({ to: `/documents/${documentId}` });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

   if (isLoading) {
    return (
      <div>
        <h2>LOADING …</h2>
      </div>
    );
  }
  return (
    <div className="space-y-6 bg-neutral-900 p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white font-bold tracking-tight">Documents</h1>
          <p className="text-gray-300 mt-2">
            Manage and edit your documents with AI assistance
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.documents.map((document: Document) => (
          <Card 
            key={document.id}
            className="cursor-pointer bg-neutral-800 transition-all duration-200 hover:shadow-elegant hover:-translate-y-1 border border-gray-500"
            onClick={() => handleDocumentClick(document.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <FileText className="h-6 w-6 text-orange-500 mt-1" />
              </div>
              <CardTitle className="text-lg text-white leading-6">{document.title}</CardTitle>
              <CardDescription className="text-gray-300 text-sm line-clamp-2">
                {document.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(document.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card 
          className="cursor-pointer transition-all text-neutral-700 duration-200 hover:shadow-elegant hover:-translate-y-1 border-dashed border-2"
          onClick={() => onAddDocument()}
        >
          <CardContent className="flex flex-col text-white items-center justify-center h-40 space-y-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Plus className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-center">
              <p className="font-medium">Add Document</p>
              <p className="text-sm text-muted-foreground">Create a new document</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
};