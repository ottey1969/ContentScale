import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, EyeOff, Copy, User, Calendar, Shield } from "lucide-react";

interface StoredPassword {
  id: string;
  email: string;
  password: string;
  deviceFingerprint: string;
  ipAddress: string;
  createdAt: string;
  lastUsed: string;
}

interface PasswordManagerProps {
  onClose?: () => void;
}

export function PasswordManager({ onClose }: PasswordManagerProps) {
  const [passwords, setPasswords] = useState<StoredPassword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPasswordData();
  }, []);

  const fetchPasswordData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/passwords');
      if (!response.ok) {
        throw new Error('Failed to fetch password data');
      }
      const data = await response.json();
      setPasswords(data.passwords || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load password data');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">Loading password data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Password Manager</h2>
            <p className="text-gray-400">View all stored user passwords</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPasswordData}
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            Refresh
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{passwords.length}</div>
            <div className="text-xs text-gray-400">Unique user accounts</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Unique IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Set(passwords.map(p => p.ipAddress)).size}
            </div>
            <div className="text-xs text-gray-400">Different IP addresses</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {passwords.filter(p => 
                new Date(p.lastUsed).getTime() > Date.now() - 24 * 60 * 60 * 1000
              ).length}
            </div>
            <div className="text-xs text-gray-400">Active in last 24h</div>
          </CardContent>
        </Card>
      </div>

      {/* Password List */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Stored Passwords ({passwords.length})
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
              Admin Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {passwords.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No passwords stored yet. Passwords will appear here when users create accounts.
              </div>
            ) : (
              <div className="space-y-3">
                {passwords.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-purple-500/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.email}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-4">
                            <span>IP: {item.ipAddress}</span>
                            <span>Device: {item.deviceFingerprint.substring(0, 8)}...</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-600/50 rounded px-2 py-1">
                            <span className="text-sm text-gray-300 font-mono">
                              {showPasswords[item.id] ? item.password : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              {showPasswords[item.id] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(item.password)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                        <span>Created: {formatDate(item.createdAt)}</span>
                        <span>Last Used: {formatDate(item.lastUsed)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}