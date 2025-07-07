import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';

interface PayPalIssue {
  id: string;
  userEmail: string;
  orderID?: string;
  transactionID?: string;
  amount: string;
  currency: string;
  issueType: 'payment_failed' | 'refund_request' | 'duplicate_charge' | 'credits_not_received' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  adminNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

interface PayPalIssueManagerProps {
  userEmail?: string;
  onIssueSubmitted?: () => void;
}

const PayPalIssueManager: React.FC<PayPalIssueManagerProps> = ({ 
  userEmail = '', 
  onIssueSubmitted 
}) => {
  const [issues, setIssues] = useState<PayPalIssue[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    userEmail: userEmail,
    orderID: '',
    transactionID: '',
    amount: '',
    currency: 'USD',
    issueType: 'payment_failed' as PayPalIssue['issueType'],
    description: ''
  });

  useEffect(() => {
    if (userEmail) {
      setFormData(prev => ({ ...prev, userEmail }));
      loadUserIssues();
    }
  }, [userEmail]);

  const loadUserIssues = async () => {
    if (!userEmail) return;
    
    try {
      const response = await fetch(`/api/paypal/issues/${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Failed to load PayPal issues:', error);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/paypal/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadUserIssues();
        setShowCreateForm(false);
        setFormData({
          userEmail: userEmail,
          orderID: '',
          transactionID: '',
          amount: '',
          currency: 'USD',
          issueType: 'payment_failed',
          description: ''
        });
        
        if (onIssueSubmitted) {
          onIssueSubmitted();
        }
        
        alert('PayPal issue submitted successfully! Our team will investigate and respond soon.');
      } else {
        const error = await response.json();
        alert(`Failed to submit issue: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting PayPal issue:', error);
      alert('Failed to submit issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: PayPalIssue['status']) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'investigating': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'escalated': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PayPalIssue['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'investigating': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'escalated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getIssueTypeLabel = (type: PayPalIssue['issueType']) => {
    switch (type) {
      case 'payment_failed': return 'Payment Failed';
      case 'refund_request': return 'Refund Request';
      case 'duplicate_charge': return 'Duplicate Charge';
      case 'credits_not_received': return 'Credits Not Received';
      case 'other': return 'Other Issue';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">PayPal Issue Manager</h3>
        </div>
        {userEmail && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Report PayPal Issue'}
          </Button>
        )}
      </div>

      {/* Create Issue Form */}
      {showCreateForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Report PayPal Payment Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Email</label>
                  <Input
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Type</label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({...formData, issueType: e.target.value as PayPalIssue['issueType']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="payment_failed">Payment Failed</option>
                    <option value="credits_not_received">Credits Not Received</option>
                    <option value="duplicate_charge">Duplicate Charge</option>
                    <option value="refund_request">Refund Request</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">PayPal Order ID (if available)</label>
                  <Input
                    value={formData.orderID}
                    onChange={(e) => setFormData({...formData, orderID: e.target.value})}
                    placeholder="Order ID from PayPal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Transaction ID (if available)</label>
                  <Input
                    value={formData.transactionID}
                    onChange={(e) => setFormData({...formData, transactionID: e.target.value})}
                    placeholder="Transaction ID from PayPal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="2.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Describe the Issue</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={4}
                  placeholder="Please describe what happened with your PayPal payment..."
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Submitting...' : 'Submit PayPal Issue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Your PayPal Issues</h4>
          {issues.map((issue) => (
            <Card key={issue.id} className="border-l-4 border-blue-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(issue.status)}
                    <Badge className={`${getStatusColor(issue.status)} text-white`}>
                      {issue.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">
                      {getIssueTypeLabel(issue.issueType)}
                    </span>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div>Created: {new Date(issue.createdAt).toLocaleDateString()}</div>
                    {issue.resolvedAt && (
                      <div>Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-700">{issue.description}</p>
                  
                  {(issue.orderID || issue.transactionID || issue.amount) && (
                    <div className="flex space-x-4 text-sm text-gray-600">
                      {issue.amount && (
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{issue.amount} {issue.currency}</span>
                        </span>
                      )}
                      {issue.orderID && <span>Order: {issue.orderID}</span>}
                      {issue.transactionID && <span>Transaction: {issue.transactionID}</span>}
                    </div>
                  )}

                  {issue.adminNotes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-gray-700 mb-1">Admin Response:</div>
                      <div className="text-sm text-gray-600">{issue.adminNotes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {userEmail && issues.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No PayPal issues reported yet.</p>
          <p className="text-sm">If you experience any payment problems, use the button above to report them.</p>
        </div>
      )}
    </div>
  );
};

export default PayPalIssueManager;