'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  Users,
  Target,
  Settings,
  Play,
  Edit,
  Trash2,
  ArrowLeft,
  Eye,
  BarChart3,
  MessageSquare,
  Globe,
  Shield,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface MicroclimateDetailViewProps {
  microclimate: any;
  currentUser: any;
}

export default function MicroclimateDetailView({
  microclimate,
  currentUser,
}: MicroclimateDetailViewProps) {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <BarChart3 className="w-4 h-4" />;
      case 'cancelled':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const response = await fetch(
        `/api/microclimates/${microclimate._id}/activate`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        router.push(`/microclimates/${microclimate._id}/live`);
      } else {
        const error = await response.json();
        console.error('Error activating microclimate:', error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error activating microclimate:', error);
      // TODO: Show error toast
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this microclimate? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/microclimates/${microclimate._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/microclimates');
      } else {
        const error = await response.json();
        console.error('Error deleting microclimate:', error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error deleting microclimate:', error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const startTime = new Date(microclimate.scheduling.start_time);
  const endTime = new Date(
    startTime.getTime() + microclimate.scheduling.duration_minutes * 60 * 1000
  );
  const now = new Date();
  const isScheduledForFuture = startTime > now;
  const canActivate = microclimate.status === 'draft' || microclimate.status === 'scheduled';
  const canEdit = microclimate.status === 'draft';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {microclimate.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Created {formatDistanceToNow(new Date(microclimate.created_at))} ago
              </p>
            </div>
          </div>
          
          <Badge
            className={`${getStatusColor(microclimate.status)} flex items-center space-x-1 px-3 py-1`}
          >
            {getStatusIcon(microclimate.status)}
            <span className="capitalize">{microclimate.status}</span>
          </Badge>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span>Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {microclimate.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{microclimate.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Participants</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {microclimate.target_participant_count || 0}
                      </p>
                      <p className="text-xs text-blue-600">Target participants</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Questions</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {microclimate.questions?.length || 0}
                      </p>
                      <p className="text-xs text-green-600">Survey questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Questions Preview */}
            {microclimate.questions && microclimate.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <span>Questions Preview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {microclimate.questions.slice(0, 3).map((question: any, index: number) => (
                        <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{question.text}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {question.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {microclimate.questions.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{microclimate.questions.length - 3} more questions
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Schedule & Actions */}
          <div className="space-y-6">
            {/* Schedule Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>Schedule</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Start Time</h4>
                    <p className="text-gray-600">
                      {format(startTime, 'PPP')}
                    </p>
                    <p className="text-gray-600">
                      {format(startTime, 'p')}
                    </p>
                    {isScheduledForFuture && (
                      <p className="text-sm text-blue-600 mt-1">
                        Starts {formatDistanceToNow(startTime, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Duration</h4>
                    <p className="text-gray-600">
                      {microclimate.scheduling.duration_minutes} minutes
                    </p>
                    <p className="text-sm text-gray-500">
                      Ends at {format(endTime, 'p')}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Timezone</h4>
                    <p className="text-gray-600">
                      {microclimate.scheduling.timezone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span>Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canActivate && (
                    <Button
                      onClick={handleActivate}
                      disabled={isActivating}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isActivating ? 'Activating...' : 'Activate Now'}
                    </Button>
                  )}
                  
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/microclimates/${microclimate._id}/edit`)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Microclimate
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/microclimates/${microclimate._id}/results`)}
                    className="w-full"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
