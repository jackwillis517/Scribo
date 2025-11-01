import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Editor } from "@/components/Editor";
import { AgentPanel } from "@/components/AgentPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelRightClose, PanelRightOpen, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import getDocumentById from "@/api/getDocumentById";
import getSectionById from "@/api/getSectionById";
import saveSection from "@/api/saveSection";

const Section = () => {
  const { documentId, sectionId } = Route.useParams();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const { isLoading: isDocumentLoading, data: document } = useQuery({
    queryKey: ["document-info", documentId],
    queryFn: () => getDocumentById(documentId!),
    staleTime: 30000,
    enabled: !!documentId,
  });

  const { isLoading: isSectionLoading, data: section } = useQuery({
    queryKey: ["section-info", sectionId],
    queryFn: () => getSectionById(sectionId!),
    staleTime: 30000,
    enabled: !!sectionId,
  });

  const handleSave = async () => {
    const updatedSection = {
      ...section.section,
      content: content,
      length: content.length,
      num_words: content.split(/\s+/).length,
    };

    try {
      await saveSection(updatedSection);
      console.log("Section saved successfully");
    } catch (error) {
      console.error("Failed to save section:", error);
    }
  };

  if (!sectionId) {
    return <div>Section not found</div>;
  }

  if (!document || !section) {
    return <div>Section not found</div>;
  }

  // Initialize content if not already set
  if (!content && section.section.content) {
    setContent(section.section.content);
  }

  if (isDocumentLoading || isSectionLoading) {
    return <div> Loading...</div>;
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between  ">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate({ to: `/documents/${document.document.id}` })
                }
                className="gap-2 cursor-pointer hover:bg-orange-500"
              >
                <ArrowLeft className="h-4 w-4 cursor-pointer hover:bg-orange-500" />
                Back to Document
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{section.section.title}</h1>
                <p className="text-sm text-gray-300">
                  {document.document.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                className="gap-2 bg-orange-500 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="gap-2 border border-gray-500 cursor-pointer hover:bg-orange-500"
              >
                {isPanelOpen ? (
                  <>
                    <PanelRightClose className="h-4 w-4" />
                    Close Panel
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="h-4 w-4" />
                    Open Panel
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Editor Layout */}
          <div className="flex gap-4 h-[calc(100vh-200px)]">
            {/* Main Editor */}
            <div
              className={`flex-1 h-full transition-all duration-300 ${
                isPanelOpen ? "mr-0" : "mr-0"
              }`}
            >
              <Editor
                content={content}
                onChange={setContent}
                placeholder={`Start writing ${section.section.title.toLowerCase()}...`}
              />
            </div>

            {/* Collapsible Agent Panel */}
            {isPanelOpen && (
              <div className="w-80 h-full border rounded border-gray-500 shadow-soft transition-all duration-300">
                <AgentPanel documentId={documentId} sectionId={sectionId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute(
  "/documents/$documentId/sections/$sectionId",
)({
  component: Section,
});
