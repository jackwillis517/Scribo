import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const sectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  content: z
    .string()
    .trim()
    .max(10000, "Content must be less than 10000 characters")
    .optional(),
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface CreateSectionForm {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SectionFormData) => void;
}

export const CreateSectionForm = ({
  open,
  onOpenChange,
  onSubmit,
}: CreateSectionForm) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleSubmit = async (data: SectionFormData) => {
    setIsSubmitting(true);
    await onSubmit(data);
    setIsSubmitting(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-800 text-white border border-gray-500">
        <DialogHeader>
          <DialogTitle>Create New Section</DialogTitle>
          <DialogDescription className="text-gray-300">
            Add a new section with an optional initial content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input
                      className="text-gray-300 border border-gray-500 outline-none focus:ring-0 focus:ring-orange-500"
                      placeholder="Enter section title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="text-gray-300 border border-gray-500 outline-none focus:ring-0 focus:ring-orange-500 min-h-[150px]"
                      placeholder="Enter initial content for this section"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                className="cursor-pointer hover:bg-orange-500 border border-gray-500 hover:border-transparent"
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer bg-orange-500"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Section"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
