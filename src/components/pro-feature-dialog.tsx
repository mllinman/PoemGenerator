"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
// import { getStripe } from "@/lib/stripe"; // Temporarily disabled
import { useToast } from "@/hooks/use-toast";

interface ProFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProFeatureDialog({ open, onOpenChange }: ProFeatureDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to upgrade to Pro.",
      });
      setLoading(false);
      return;
    }

    try {
      // Temporarily disabled stripe integration
      throw new Error('Pro upgrade temporarily unavailable');
      /*
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await res.json();
      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
      */
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Unlock Pro Features
          </DialogTitle>
          <DialogDescription>
            Upgrade to Muse Pro to save and download your beautiful poems.
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
          <Button className="w-full sm:w-auto" size="lg" onClick={handleUpgrade} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
