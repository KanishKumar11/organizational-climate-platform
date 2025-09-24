'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Settings,
  Mail,
  CheckCircle,
  Building,
  UserPlus,
  MessageSquare,
  Calendar,
  Target,
} from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export interface SurveyCreationData {
  // Step 1: Basic Information
  title: string;
  description: string;
  type:
    | 'general_climate'
    | 'microclimate'
    | 'organizational_culture'
    | 'custom';

  // Step 2: Target Audience
  department_ids: string[];
  target_responses: number;
  estimated_duration: number;

  // Step 3: Questions & Demographics
  questions: any[];
  demographics: any[];

  // Step 4: Settings & Schedule
  start_date: string;
  end_date: string;
  anonymous: boolean;
  allow_partial_responses: boolean;

  // Step 5: Invitation Settings
  custom_message: string;
  include_credentials: boolean;
  send_immediately: boolean;
  custom_subject: string;
}

interface SurveyCreationWizardProps {
  onComplete: (data: SurveyCreationData) => void;
  onCancel: () => void;
}

export function SurveyCreationWizard({
  onComplete,
  onCancel,
}: SurveyCreationWizardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const [surveyData, setSurveyData] = useState<SurveyCreationData>({
    title: '',
    description: '',
    type: 'general_climate',
    department_ids: [],
    target_responses: 50,
    estimated_duration: 10,
    questions: [],
    demographics: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    anonymous: false,
    allow_partial_responses: true,
    custom_message: '',
    include_credentials: true,
    send_immediately: true,
    custom_subject: '',
  });

  const steps: WizardStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Survey title, description, and type',
      icon: <FileText className="h-5 w-5" />,
      completed: !!(
        surveyData.title &&
        surveyData.description &&
        surveyData.type
      ),
    },
    {
      id: 'audience',
      title: 'Target Audience',
      description: 'Select departments and participants',
      icon: <Users className="h-5 w-5" />,
      completed: surveyData.department_ids.length > 0,
    },
    {
      id: 'questions',
      title: 'Questions & Demographics',
      description: 'Build survey questions and capture demographics',
      icon: <MessageSquare className="h-5 w-5" />,
      completed: surveyData.questions.length > 0,
    },
    {
      id: 'settings',
      title: 'Settings & Schedule',
      description: 'Configure survey settings and timeline',
      icon: <Settings className="h-5 w-5" />,
      completed: !!(surveyData.start_date && surveyData.end_date),
    },
    {
      id: 'invitations',
      title: 'Invitation Setup',
      description: 'Customize invitation emails and credentials',
      icon: <Mail className="h-5 w-5" />,
      completed: true, // Always considered complete as it has defaults
    },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Review all settings and launch survey',
      icon: <CheckCircle className="h-5 w-5" />,
      completed: false,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    fetchDepartments();
    if (session?.user.role === 'super_admin') {
      fetchCompanies();
    }
  }, [session]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data?.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const updateSurveyData = (updates: Partial<SurveyCreationData>) => {
    setSurveyData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    return steps[currentStep].completed;
  };

  const handleComplete = async () => {
    if (!canProceed()) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }

    setIsLoading(true);
    try {
      await onComplete(surveyData);
      toast.success('Survey created successfully!');
    } catch (error) {
      toast.error('Failed to create survey. Please try again.');
      console.error('Error creating survey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderTargetAudience();
      case 2:
        return renderQuestionsAndDemographics();
      case 3:
        return renderSettingsAndSchedule();
      case 4:
        return renderInvitationSetup();
      case 5:
        return renderReviewAndLaunch();
      default:
        return null;
    }
  };

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Survey Title *</Label>
        <Input
          id="title"
          value={surveyData.title}
          onChange={(e) => updateSurveyData({ title: e.target.value })}
          placeholder="Enter survey title"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={surveyData.description}
          onChange={(e) => updateSurveyData({ description: e.target.value })}
          placeholder="Describe the purpose and goals of this survey"
          className="mt-1"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="type">Survey Type *</Label>
        <Select
          value={surveyData.type}
          onValueChange={(value: any) => updateSurveyData({ type: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select survey type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general_climate">
              General Climate Survey
            </SelectItem>
            <SelectItem value="microclimate">Microclimate Survey</SelectItem>
            <SelectItem value="organizational_culture">
              Organizational Culture
            </SelectItem>
            <SelectItem value="custom">Custom Survey</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTargetAudience = () => (
    <div className="space-y-6">
      <div>
        <Label>Target Departments *</Label>
        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
          {departments.map((dept) => (
            <div key={dept._id} className="flex items-center space-x-2">
              <Checkbox
                id={dept._id}
                checked={surveyData.department_ids.includes(dept._id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateSurveyData({
                      department_ids: [...surveyData.department_ids, dept._id],
                    });
                  } else {
                    updateSurveyData({
                      department_ids: surveyData.department_ids.filter(
                        (id) => id !== dept._id
                      ),
                    });
                  }
                }}
              />
              <Label htmlFor={dept._id} className="text-sm font-normal">
                {dept.name} ({dept.user_count || 0} users)
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="target_responses">Target Responses</Label>
          <Input
            id="target_responses"
            type="number"
            value={surveyData.target_responses}
            onChange={(e) =>
              updateSurveyData({
                target_responses: parseInt(e.target.value) || 0,
              })
            }
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="estimated_duration">
            Estimated Duration (minutes)
          </Label>
          <Input
            id="estimated_duration"
            type="number"
            value={surveyData.estimated_duration}
            onChange={(e) =>
              updateSurveyData({
                estimated_duration: parseInt(e.target.value) || 0,
              })
            }
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderQuestionsAndDemographics = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">
          Questions & Demographics
        </h3>
        <p className="text-sm text-blue-700">
          Add survey questions and configure demographic data collection for
          detailed reporting.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Survey Questions ({surveyData.questions.length})</Label>
          <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">No questions added yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Add default questions for demo
                updateSurveyData({
                  questions: [
                    {
                      id: '1',
                      text: 'How satisfied are you with your current work environment?',
                      type: 'likert',
                      scale_min: 1,
                      scale_max: 5,
                      required: true,
                      order: 1,
                    },
                    {
                      id: '2',
                      text: 'How would you rate communication within your team?',
                      type: 'emoji_scale',
                      emoji_options: [
                        { emoji: '😞', label: 'Poor', value: 1 },
                        { emoji: '😐', label: 'Fair', value: 2 },
                        { emoji: '😊', label: 'Good', value: 3 },
                        { emoji: '😄', label: 'Great', value: 4 },
                        { emoji: '🤩', label: 'Excellent', value: 5 },
                      ],
                      required: true,
                      order: 2,
                    },
                  ],
                });
              }}
            >
              Add Sample Questions
            </Button>
          </div>
        </div>

        <div>
          <Label>Demographics Collection</Label>
          <div className="mt-2 space-y-2">
            {[
              { field: 'gender', label: 'Gender', type: 'select' },
              {
                field: 'education_level',
                label: 'Education Level',
                type: 'select',
              },
              { field: 'job_title', label: 'Job Title', type: 'text' },
              {
                field: 'work_location',
                label: 'Work Location',
                type: 'select',
              },
              {
                field: 'tenure_months',
                label: 'Tenure (months)',
                type: 'number',
              },
            ].map((demo) => (
              <div key={demo.field} className="flex items-center space-x-2">
                <Checkbox
                  id={demo.field}
                  checked={surveyData.demographics.some(
                    (d) => d.field === demo.field
                  )}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateSurveyData({
                        demographics: [
                          ...surveyData.demographics,
                          {
                            field: demo.field,
                            label: demo.label,
                            type: demo.type,
                            required: false,
                          },
                        ],
                      });
                    } else {
                      updateSurveyData({
                        demographics: surveyData.demographics.filter(
                          (d) => d.field !== demo.field
                        ),
                      });
                    }
                  }}
                />
                <Label htmlFor={demo.field} className="text-sm font-normal">
                  {demo.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsAndSchedule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={surveyData.start_date}
            onChange={(e) => updateSurveyData({ start_date: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            value={surveyData.end_date}
            onChange={(e) => updateSurveyData({ end_date: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={surveyData.anonymous}
            onCheckedChange={(checked) =>
              updateSurveyData({ anonymous: !!checked })
            }
          />
          <Label htmlFor="anonymous">Anonymous responses</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_partial"
            checked={surveyData.allow_partial_responses}
            onCheckedChange={(checked) =>
              updateSurveyData({ allow_partial_responses: !!checked })
            }
          />
          <Label htmlFor="allow_partial">Allow partial responses</Label>
        </div>
      </div>
    </div>
  );

  const renderInvitationSetup = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="custom_subject">Custom Email Subject</Label>
        <Input
          id="custom_subject"
          value={surveyData.custom_subject}
          onChange={(e) => updateSurveyData({ custom_subject: e.target.value })}
          placeholder="Your feedback is needed: [Survey Title]"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="custom_message">Custom Message</Label>
        <Textarea
          id="custom_message"
          value={surveyData.custom_message}
          onChange={(e) => updateSurveyData({ custom_message: e.target.value })}
          placeholder="Add a personal message to your invitation email..."
          className="mt-1"
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include_credentials"
            checked={surveyData.include_credentials}
            onCheckedChange={(checked) =>
              updateSurveyData({ include_credentials: !!checked })
            }
          />
          <Label htmlFor="include_credentials">
            Include login credentials in invitation emails
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="send_immediately"
            checked={surveyData.send_immediately}
            onCheckedChange={(checked) =>
              updateSurveyData({ send_immediately: !!checked })
            }
          />
          <Label htmlFor="send_immediately">
            Send invitations immediately after creation
          </Label>
        </div>
      </div>
    </div>
  );

  const renderReviewAndLaunch = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">Ready to Launch!</h3>
        <p className="text-sm text-green-700">
          Review your survey settings below and click "Create Survey" to launch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">
              Survey Title
            </Label>
            <p className="font-medium">{surveyData.title}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Type</Label>
            <Badge variant="secondary">
              {surveyData.type.replace('_', ' ')}
            </Badge>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">
              Target Departments
            </Label>
            <p>{surveyData.department_ids.length} departments selected</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">
              Questions
            </Label>
            <p>{surveyData.questions.length} questions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">
              Schedule
            </Label>
            <p>
              {surveyData.start_date} to {surveyData.end_date}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">
              Settings
            </Label>
            <div className="space-y-1">
              <p className="text-sm">
                • {surveyData.anonymous ? 'Anonymous' : 'Confidential'}{' '}
                responses
              </p>
              <p className="text-sm">
                • {surveyData.allow_partial_responses ? 'Allows' : 'Requires'}{' '}
                complete responses
              </p>
              <p className="text-sm">
                • {surveyData.include_credentials ? 'Includes' : 'Excludes'}{' '}
                login credentials
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Survey
        </h1>
        <p className="text-gray-600">
          Follow the steps below to create and launch your organizational
          climate survey
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center space-y-2 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Survey'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
