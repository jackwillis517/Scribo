import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { Editor } from "@/components/Editor";
import { AgentPanel } from "@/components/AgentPanel";
import { Button } from "@/components/ui/button";
import { getDocumentById, getSectionById } from "@/data/mockData";
import { ArrowLeft, PanelRightClose, PanelRightOpen, Save } from "lucide-react";

const Section = () => {
  const { documentId, sectionId } = Route.useParams()
  const navigate = useNavigate();
  
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [content, setContent] = useState('');

  if (!sectionId) {
    return <div>Section not found</div>;
  }

  const document = getDocumentById(documentId);
  const section = getSectionById(sectionId);

  if (!document || !section) {
    return <div>Section not found</div>;
  }

  // Initialize content if not already set
  if (!content && section.content) {
    setContent(section.content);
  }

  const handleSave = () => {
    // Save popup here
  };

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between  ">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate({to: `/documents/${document.id}`})}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 cursor-pointer" />
                Back to Document
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{section.title}</h1>
                <p className="text-sm text-gray-300">{document.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} className="gap-2 bg-orange-500 cursor-pointer">
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
            <div className={`flex-1 transition-all duration-300 ${
              isPanelOpen ? 'mr-0' : 'mr-0'
            }`}>
              <Editor
                content={content}
                onChange={setContent}
                placeholder={`Start writing ${section.title.toLowerCase()}...`}
              />
            </div>

            {/* Collapsible Agent Panel */}
            {isPanelOpen && (
              <div className="w-80 border rounded border-gray-500 shadow-soft transition-all duration-300">
                <AgentPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/documents/$documentId/sections/$sectionId")({
  component: Section,
})