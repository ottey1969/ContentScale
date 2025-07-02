import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Mail, Gift, Sparkles } from "lucide-react";
import { z } from "zod";

interface EmailCapturePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailCaptured: (email: string, firstName?: string) => void;
  source: string; // 'landing_page', 'exit_intent', 'content_download'
}

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
});

export function EmailCapturePopup({ isOpen, onClose, onEmailCaptured, source }: EmailCapturePopupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate email
      const validation = emailSchema.safeParse({ email, firstName });
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        setIsSubmitting(false);
        return;
      }

      // Submit to backend
      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          source,
          subscribedToNewsletter: true,
          subscribedToMarketing: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to capture email');
      }

      // Success
      onEmailCaptured(email, firstName);
      
    } catch (err) {
      console.error('Email capture error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPopupContent = () => {
    switch (source) {
      case 'exit_intent':
        return {
          title: "Wait! Don't Leave Yet! 🚀",
          subtitle: "Get Your FREE SEO Content Strategy Guide",
          description: "Join 10,000+ marketers who get our proven content templates and SEO secrets delivered weekly.",
          buttonText: "Get My Free Guide",
          offer: "✅ Free Content Templates\n✅ SEO Optimization Checklist\n✅ Weekly Marketing Tips"
        };
      case 'content_download':
        return {
          title: "Download Your Content 📥",
          subtitle: "Enter your email to get instant access",
          description: "We'll send your generated content directly to your inbox, plus bonus SEO tips.",
          buttonText: "Download Content",
          offer: "✅ Instant Content Download\n✅ Bonus SEO Checklist\n✅ Marketing Tips"
        };
      default: // landing_page
        return {
          title: "🎯 Get Your First Article FREE!",
          subtitle: "Join 10,000+ Content Creators",
          description: "Start creating professional, SEO-optimized content in minutes. No credit card required.",
          buttonText: "Claim Free Article",
          offer: "✅ 1 Free Premium Article\n✅ SEO Optimization Included\n✅ Professional Quality Content"
        };
    }
  };

  const content = getPopupContent();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-purple-500/30 animate-in slide-in-from-bottom-4">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-red-500/20"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {source === 'content_download' ? (
              <Mail className="w-10 h-10 text-white" />
            ) : (
              <Gift className="w-10 h-10 text-white" />
            )}
          </div>
          
          <CardTitle className="text-white text-2xl mb-2">
            {content.title}
          </CardTitle>
          <p className="text-purple-300 font-medium">{content.subtitle}</p>
          <p className="text-gray-300 text-sm mt-2">{content.description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-white font-medium">What You Get:</span>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-line">
              {content.offer}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="First Name (Optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            
            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                content.buttonText
              )}
            </Button>
          </form>

          {/* Trust indicators */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>✓ No spam, unsubscribe anytime</p>
            <p>✓ 10,000+ marketers trust us</p>
            <p>✓ Instant access, no waiting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}