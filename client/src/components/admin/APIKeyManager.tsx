import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, Shield, DollarSign } from "lucide-react";

export default function APIKeyManager() {
  // Check if user is admin
  const { data: user } = useQuery<{ id: string; email: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Only show for admin users
  if (!user || user.email !== "ottmar.francisca19@gmail.com") {
    return null;
  }
  const [anthropicKey, setAnthropicKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [loading, setLoading] = useState("");
  const { toast } = useToast();

  const addSecret = async (key: string, value: string, label: string) => {
    if (!value.trim()) {
      toast({
        title: "Error",
        description: `Please enter the ${label}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(key);
    
    try {
      const response = await fetch('/api/admin/add-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: value.trim() })
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: `${label} added successfully`,
        });
        
        // Clear the input
        if (key === 'ANTHROPIC_API_KEY') setAnthropicKey("");
        if (key === 'PAYPAL_CLIENT_ID') setPaypalClientId("");
        if (key === 'PAYPAL_CLIENT_SECRET') setPaypalSecret("");
      } else {
        const error = await response.json();
        toast({
          title: "Failed",
          description: error.message || "Failed to add API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading("");
    }
  };

  return (
    <Card className="bg-surface border-surface-light">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-primary" />
          <span>API Configuration</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Anthropic API Key */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-500" />
            <h3 className="font-medium">Anthropic API Key</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Powers AI content generation • Get from console.anthropic.com
          </p>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="sk-ant-api03-xxxxx..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => addSecret('ANTHROPIC_API_KEY', anthropicKey, 'Anthropic API Key')}
              disabled={loading === 'ANTHROPIC_API_KEY'}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading === 'ANTHROPIC_API_KEY' ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        {/* PayPal Client ID */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium">PayPal Client ID</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Enables $2/article payments • Get from developer.paypal.com
          </p>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="AXxxxxxxxxxxxxxxxxxxxxxZ"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => addSecret('PAYPAL_CLIENT_ID', paypalClientId, 'PayPal Client ID')}
              disabled={loading === 'PAYPAL_CLIENT_ID'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading === 'PAYPAL_CLIENT_ID' ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        {/* PayPal Secret */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium">PayPal Client Secret</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Secret key for payment authentication
          </p>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="EXxxxxxxxxxxxxxxxxxxxxxZ"
              value={paypalSecret}
              onChange={(e) => setPaypalSecret(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => addSecret('PAYPAL_CLIENT_SECRET', paypalSecret, 'PayPal Client Secret')}
              disabled={loading === 'PAYPAL_CLIENT_SECRET'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading === 'PAYPAL_CLIENT_SECRET' ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        <div className="bg-dark p-4 rounded-lg">
          <h4 className="font-medium mb-2">💰 Revenue Model</h4>
          <p className="text-sm text-text-secondary">
            • $2.00 per article revenue<br/>
            • ~$0.30 Anthropic API cost<br/>
            • <span className="text-green-500 font-medium">$1.70 profit per article (85% margin)</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}