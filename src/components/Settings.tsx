import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Server, Database, Shield, Bot, Wifi, Settings as SettingsIcon } from 'lucide-react';
import { pyPoeAPI, BackendConfig, HealthStatus } from '@/services/api';

const Settings: React.FC = () => {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const [configData, healthData] = await Promise.all([
        pyPoeAPI.getConfig(),
        pyPoeAPI.getHealthStatus()
      ]);
      setConfig(configData);
      setHealth(healthData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadConfiguration} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">System Configuration</h1>
      </div>

      {/* Backend Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend Status
          </CardTitle>
          <CardDescription>PyPoe backend server information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
                  {health?.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {health?.status !== 'healthy' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {health?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version:</span>
                <span className="text-sm text-gray-600">{config?.backend_version}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CORS Enabled:</span>
                <Badge variant={config?.cors_enabled ? 'default' : 'secondary'}>
                  {config?.cors_enabled ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WebSocket:</span>
                <Badge variant={config?.websocket_enabled ? 'default' : 'secondary'}>
                  <Wifi className="h-3 w-3 mr-1" />
                  {config?.websocket_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication
          </CardTitle>
          <CardDescription>Security and access control settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication Required:</span>
              <Badge variant={config?.authentication_enabled ? 'default' : 'secondary'}>
                {config?.authentication_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {config?.authentication_enabled && config?.username && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Username:</span>
                <span className="text-sm text-gray-600">{config.username}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database
          </CardTitle>
          <CardDescription>Conversation storage and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Path:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {config?.database_path}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">History Enabled:</span>
              <Badge variant={config?.features.conversation_history ? 'default' : 'secondary'}>
                {config?.features.conversation_history ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Bots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Available AI Bots
          </CardTitle>
          <CardDescription>
            {config?.total_bots} bots available for conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {config?.available_bots.map((bot, index) => (
              <Badge key={index} variant="outline" className="justify-center p-2">
                {bot}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Enabled Features</CardTitle>
          <CardDescription>System capabilities and functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config?.features && Object.entries(config.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {feature.replace(/_/g, ' ')}:
                </span>
                <Badge variant={enabled ? 'default' : 'secondary'}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Available backend API routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {config?.api_endpoints.map((endpoint, index) => (
              <code key={index} className="text-xs bg-gray-100 px-2 py-1 rounded block">
                {endpoint}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadConfiguration} variant="outline">
          Refresh Configuration
        </Button>
      </div>
    </div>
  );
};

export default Settings; 