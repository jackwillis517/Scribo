import { Card,  CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from '@tanstack/react-router';
import type { Section } from "@/data/mockData";

import { ChevronRight, Edit3 } from "lucide-react";

interface SectionListProps {
  sections: Section[];
  documentId: string;
}

export const SectionList = ({ sections }: SectionListProps) => {
  const navigate = useNavigate();

  const handleSectionClick = (sectionId: string) => {
    navigate({ to: `sections/${sectionId}` });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sections</h2>
        <p className="text-gray-300 mt-1">
          Click any section to start editing
        </p>
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
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <ChevronRight className="h-4 w-4 text-white transition-transform hover:m-4" />
              </div>
              <CardDescription className="line-clamp-2 text-sm text-gray-300">
                {section.preview}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};