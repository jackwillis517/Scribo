import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { SectionList } from '@/components/SectionList';
import { useQuery } from '@tanstack/react-query';
import getDocumentById from '@/api/getDocumentById';
import getAllSectons from '@/api/getAllSections';

const Document = () => {
  const { documentId } = Route.useParams()
  const navigate = useNavigate();

  const {isLoading: isDocumentLoading, data: document } = useQuery({
    queryKey: ['document-info', documentId],
    queryFn: () => getDocumentById(documentId!),
    staleTime: 30000,
    enabled: !!documentId,
  });

  const {isLoading: isSectionsLoading, data: sections } = useQuery({
    queryKey: ['sections-list'],
    queryFn: () => getAllSectons(),
    staleTime: 30000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate({to: '/'})}
            className="gap-2 text-white cursor-pointer hover:bg-orange-500"
          >
            <ArrowLeft className="h-4 w-4 text-white cursor-pointer hover:bg-orange-500" />
            Back to Dashboard
          </Button>

          {isDocumentLoading || isSectionsLoading ? (
            <div>
              <h2>LOADING …</h2>
            </div>
          ) : !document ? (
            <Card className="shadow-soft bg-neutral-800 border-gray-500">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-orange-500">
                    <FileText className="h-6 w-6 text-white " />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">No Document Found</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
            ) : sections ? (
            <>
              <Card className="shadow-soft bg-neutral-800 border-gray-500">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-orange-500">
                      <FileText className="h-6 w-6 text-white " />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{document.document.title}</CardTitle>
                      <p className="text-gray-300 mb-4">{document.document.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-300"/>
                          <span className="text-gray-300">Created:</span>
                          <span className="font-medium">{formatDate(document.document.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-300" />
                          <span className="text-gray-300">Updated:</span>
                          <span className="font-medium">{formatDate(document.document.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <SectionList sections={sections.sections} documentId={documentId} />
            </>
          ) : ( 
            <div>No sections found.</div> 
          )
        }

        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/documents/$documentId/')({
  component: Document,
})


