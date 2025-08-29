'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Camera,
  History,
  RotateCcw,
  Trash2,
  Plus,
  Calendar,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { IDemographicSnapshot } from '../../models/DemographicSnapshot';
import DemographicComparison from './DemographicComparison';

interface DemographicSnapshotsProps {
  surveyId: string;
  companyId: string;
  onSnapshotCreated?: (snapshot: IDemographicSnapshot) => void;
  onSnapshotRolledBack?: (snapshot: IDemographicSnapshot) => void;
}

export default function DemographicSnapshots({
  surveyId,
  companyId,
  onSnapshotCreated,
  onSnapshotRolledBack,
}: DemographicSnapshotsProps) {
  const [snapshots, setSnapshots] = useState<IDemographicSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<IDemographicSnapshot | null>(null);
  const [createReason, setCreateReason] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSnapshots();
  }, [surveyId]);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/demographics/snapshots?survey_id=${surveyId}&company_id=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch snapshots');
      }

      const data = await response.json();
      setSnapshots(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch snapshots'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!createReason.trim()) {
      setError('Please provide a reason for creating the snapshot');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/demographics/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_id: surveyId,
          company_id: companyId,
          reason: createReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create snapshot');
      }

      const data = await response.json();
      const newSnapshot = data.data;

      setSnapshots((prev) => [newSnapshot, ...prev]);
      setCreateDialogOpen(false);
      setCreateReason('');
      onSnapshotCreated?.(newSnapshot);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create snapshot'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedSnapshot || !rollbackReason.trim()) {
      setError('Please provide a reason for the rollback');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/demographics/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_id: surveyId,
          target_version: selectedSnapshot.version,
          reason: rollbackReason,
          company_id: companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rollback snapshot');
      }

      const data = await response.json();
      const rollbackSnapshot = data.data;

      setSnapshots((prev) => [rollbackSnapshot, ...prev]);
      setRollbackDialogOpen(false);
      setRollbackReason('');
      setSelectedSnapshot(null);
      onSnapshotRolledBack?.(rollbackSnapshot);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to rollback snapshot'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveSnapshot = async (snapshot: IDemographicSnapshot) => {
    if (
      !confirm(
        'Are you sure you want to archive this snapshot? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/demographics/snapshots/${snapshot._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to archive snapshot');
      }

      setSnapshots((prev) => prev.filter((s) => s._id !== snapshot._id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to archive snapshot'
      );
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const getVersionBadge = (snapshot: IDemographicSnapshot) => {
    const isLatest =
      snapshot.version === Math.max(...snapshots.map((s) => s.version));
    return (
      <Badge variant={isLatest ? 'default' : 'secondary'}>
        v{snapshot.version}
        {isLatest && ' (Latest)'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading snapshots...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Demographic Snapshots
            </CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Snapshot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Demographic Snapshot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Reason for creating snapshot
                    </label>
                    <Textarea
                      value={createReason}
                      onChange={(e) => setCreateReason(e.target.value)}
                      placeholder="e.g., Before major organizational restructure"
                      rows={3}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateSnapshot}
                      disabled={actionLoading || !createReason.trim()}
                      className="flex-1"
                    >
                      {actionLoading ? 'Creating...' : 'Create Snapshot'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Demographic snapshots capture the organizational structure at
            specific points in time, enabling version tracking and rollback
            capabilities.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Snapshots List */}
      <Card>
        <CardHeader>
          <CardTitle>Snapshot History</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                No demographic snapshots found
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create First Snapshot
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot._id.toString()}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getVersionBadge(snapshot)}
                        <span className="text-sm text-gray-600">
                          {formatDate(snapshot.timestamp)}
                        </span>
                        {snapshot.changes.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {snapshot.changes.length} changes
                          </Badge>
                        )}
                      </div>

                      <p className="font-medium mb-2">{snapshot.reason}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {snapshot.metadata.total_users} users
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {snapshot.metadata.departments_count} departments
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created by {snapshot.created_by}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSnapshot(snapshot);
                          setRollbackDialogOpen(true);
                        }}
                        disabled={
                          snapshot.version ===
                          Math.max(...snapshots.map((s) => s.version))
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Rollback
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveSnapshot(snapshot)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Tool */}
      {snapshots.length >= 2 && (
        <DemographicComparison
          surveyId={surveyId}
          snapshots={snapshots}
          onCompare={(result) => {
            // Handle comparison result if needed
            console.log('Comparison result:', result);
          }}
        />
      )}

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback to Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSnapshot && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You are about to rollback to version{' '}
                  {selectedSnapshot.version} created on{' '}
                  {formatDate(selectedSnapshot.timestamp)}. This will create a
                  new snapshot with the demographic data from the selected
                  version.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason for rollback
              </label>
              <Textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="e.g., Incorrect demographic changes need to be reverted"
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleRollback}
                disabled={actionLoading || !rollbackReason.trim()}
                className="flex-1"
                variant="destructive"
              >
                {actionLoading ? 'Rolling back...' : 'Confirm Rollback'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRollbackDialogOpen(false);
                  setSelectedSnapshot(null);
                  setRollbackReason('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
