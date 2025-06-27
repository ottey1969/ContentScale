import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, Users, Activity, Lock, Eye, Zap, CheckCircle } from "lucide-react";

interface SecurityMetrics {
  totalSuspiciousEvents: number;
  blockedIPs: number;
  activeUsers: number;
  rateLimitViolations: number;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  ipAddress: string;
  fingerprint: string;
  userAgent: string;
  createdAt: string;
  metadata?: any;
}

export default function SecurityDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<SecurityMetrics>({
    queryKey: ["/api/admin/security/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: events, isLoading: eventsLoading } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/admin/security/events"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const threatLevel = metrics ? 
    (metrics.totalSuspiciousEvents > 50 ? 'high' : 
     metrics.totalSuspiciousEvents > 20 ? 'medium' : 'low') : 'low';

  const securityFeatures = [
    {
      icon: Shield,
      title: "Threat Assessment Content",
      description: "Real-time analysis of suspicious activities and potential security threats",
      status: "active",
      color: "bg-green-500",
    },
    {
      icon: Lock,
      title: "Security Audit Templates", 
      description: "Comprehensive templates for security audits and compliance checks",
      status: "active",
      color: "bg-blue-500",
    },
    {
      icon: CheckCircle,
      title: "Compliance Documentation",
      description: "Automated generation of security compliance reports and documentation",
      status: "active", 
      color: "bg-purple-500",
    },
    {
      icon: Eye,
      title: "Advanced Monitoring",
      description: "IP tracking, fingerprinting, and behavioral analysis for abuse prevention",
      status: "active",
      color: "bg-orange-500",
    }
  ];

  return (
    <div className="space-y-6">
      {/* Security Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-red-500 rounded-lg">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cybersecurity Expertise
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Specialized training for cybersecurity consultancy and threat analysis content
          </p>
        </div>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityFeatures.map((feature, index) => (
          <Card key={index} className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 ${feature.color} rounded-lg`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                  {feature.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              Threat Events (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.totalSuspiciousEvents || 0}
            </div>
            <Badge 
              variant={threatLevel === 'high' ? 'destructive' : 
                      threatLevel === 'medium' ? 'secondary' : 'default'}
              className="mt-2"
            >
              {threatLevel.toUpperCase()} RISK
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-red-500" />
              Blocked IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.blockedIPs || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active blocks</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.activeUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-orange-500" />
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.rateLimitViolations || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Events Log */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${
                      event.eventType === 'suspicious_activity' ? 'bg-red-100 text-red-600' :
                      event.eventType === 'content_generation' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        IP: {event.ipAddress} • {event.fingerprint.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No security events detected</p>
              <p className="text-sm">System is secure and monitoring</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Security Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Generate Threat Report
            </Button>
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
            <Button variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Compliance Check
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Full Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}