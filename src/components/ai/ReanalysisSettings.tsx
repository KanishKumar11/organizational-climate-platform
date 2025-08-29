'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  Settings,
  Zap,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

interface ReanalysisConfig {
  trigger_threshold: number;
  auto_reanalyze: boolean;
  notification_enabled: boolean;
  incremental_only: boolean;
}

interface ReanalysisSettingsProps {
  surveyId: string;
  companyId: string;
  onConfigUpdate?: (config: ReanalysisConfig) => void;
}

export default function ReanalysisSettings({
  surveyId,
  companyId,
  onConfigUpdate,
}: ReanalysisSettingsProps) {
  const [config, setConfig] = useState<ReanalysisConfig>({
    trigger_threshold: 30,
    auto_reanalyze: true,
    notification_enabled: true,
    incremental_only: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [surveyId, companyId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ai/reanalysis/config?survey_id=${surveyId}&company_id=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      setConfig(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch configuration'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/ai/reanalysis/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_id: surveyId,
          company_id: companyId,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      const data = await response.json();
      setConfig(data.data);
      setSuccess(true);
      onConfigUpdate?.(data.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: keyof ReanalysisConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const getThresholdLabel = (threshold: number) => {
    if (threshold >= 70) return 'High Sensitivity';
    if (threshold >= 40) return 'Medium Sensitivity';
    return 'Low Sensitivity';
  };

  const getThresholdColor = (threshold: number) => {
    if (threshold >= 70) return 'text-red-600 bg-red-50';
    if (threshold >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Re-analysis Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Configuration updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Trigger Threshold */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Impact Threshold</h3>
              <p className="text-sm text-gray-600">
                Minimum impact score required to trigger automatic re-analysis
              </p>
            </div>
            <Badge className={getThresholdColor(config.trigger_threshold)}>
              {getThresholdLabel(config.trigger_threshold)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Low (0%)</span>
              <span className="font-medium">{config.trigger_threshold}%</span>
              <span>High (100%)</span>
            </div>
            <Slider
              value={[config.trigger_threshold]}
              onValueChange={(value) =>
                handleConfigChange('trigger_threshold', value[0])
              }
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Lower thresholds trigger re-analysis more frequently but may
              create unnecessary processing. Higher thresholds only trigger for
              significant demographic changes.
            </AlertDescription>
          </Alert>
        </div>

        {/* Auto Re-analysis */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium">Automatic Re-analysis</h4>
              <p className="text-sm text-gray-600">
                Automatically trigger AI re-analysis when demographic changes
                exceed threshold
              </p>
            </div>
          </div>
          <Switch
            checked={config.auto_reanalyze}
            onCheckedChange={(checked) =>
              handleConfigChange('auto_reanalyze', checked)
            }
          />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium">Change Notifications</h4>
              <p className="text-sm text-gray-600">
                Send notifications when demographic changes are detected
              </p>
            </div>
          </div>
          <Switch
            checked={config.notification_enabled}
            onCheckedChange={(checked) =>
              handleConfigChange('notification_enabled', checked)
            }
          />
        </div>

        {/* Incremental Processing */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <h4 className="font-medium">Incremental Processing</h4>
              <p className="text-sm text-gray-600">
                Only re-analyze affected demographic segments for better
                performance
              </p>
            </div>
          </div>
          <Switch
            checked={config.incremental_only}
            onCheckedChange={(checked) =>
              handleConfigChange('incremental_only', checked)
            }
          />
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Trigger Threshold:</span>
              <span className="ml-2 font-medium">
                {config.trigger_threshold}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Auto Re-analysis:</span>
              <span className="ml-2 font-medium">
                {config.auto_reanalyze ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Notifications:</span>
              <span className="ml-2 font-medium">
                {config.notification_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Processing Mode:</span>
              <span className="ml-2 font-medium">
                {config.incremental_only ? 'Incremental' : 'Full'}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
