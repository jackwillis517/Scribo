import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import type { Section } from "@/data/mockData";
import { ChevronRight, Edit3, Trash2, Plus } from "lucide-react";
import deleteSection from "@/api/deleteSection";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface SectionListProps {
  sections: Section[];
  documentId: string;
}

export const SectionList = ({ sections, documentId }: SectionListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSectionClick = (sectionId: string) => {
    navigate({ to: `sections/${sectionId}` });
  };

  const handleDeleteSection = async (
    sectionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent card click navigation

    setDeletingId(sectionId);
    try {
      await deleteSection(sectionId);
      toast({
        title: "Success",
        description: "Section deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({
        queryKey: ["sections-list", documentId],
      });
    } catch (error) {
      console.error("Failed to delete section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSection = () => {
    console.log("clicked");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sections</h2>
        <p className="text-gray-300 mt-1">Click any section to start editing</p>
      </div>

      <div className="space-y-3 ">
        {sections.map((section) => (
          <Card
            key={section.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-soft hover:border-orange-500 border border-gray-500 bg-neutral-800"
            onClick={() => handleSectionClick(section.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-lg pl-2">
                    {section.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={(e) => handleDeleteSection(section.id, e)}
                    disabled={deletingId === section.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-2"
                  >
                    <Trash2 className="h-8 w-8" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2 text-sm text-gray-300">
                {section.preview}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}

        <Card
          className="cursor-pointer transition-all text-neutral-700 duration-200 hover:shadow-soft hover:border-orange-500 border-dashed border-2 border-gray-500 bg-neutral-800"
          onClick={handleAddSection}
        >
          <CardHeader className="pb-1 justify-center">
            <div className="flex items-center gap-4 text-center">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Plus className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">
                  Add Section
                </CardTitle>
                <CardDescription className="text-sm text-gray-300">
                  Create a new section
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
