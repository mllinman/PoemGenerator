"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ProFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProFeatureDialog({ open, onOpenChange }: ProFeatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Unlock Pro Features
          </DialogTitle>
          <DialogDescription>
            Upgrade to Muse Quill Pro to save and download your beautiful poems.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Save Unlimited Poems:</strong> Keep all your creations in
              one place.
            </li>
            <li>
              <strong>Download as PDF & PNG:</strong> Get high-quality files for printing
              and sharing.
            </li>
            <li>
              <strong>Full Customization:</strong> Access all layout, font, and
              color options.
            </li>
          </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="text-center sm:text-left">
                <p className="text-2xl font-bold">$5</p>
                <p className="text-sm text-muted-foreground -mt-1">per month</p>
            </div>
          <Button className="w-full sm:w-auto" size="lg">
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
