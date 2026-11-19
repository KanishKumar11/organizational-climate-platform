'use client';

import React from 'react';
import { MicroclimateWizard } from './MicroclimateWizard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Rocket, CheckCircle2 } from 'lucide-react';

/**
 * Microclimate Wizard Demo
 *
 * Interactive demonstration of the complete survey wizard.
 */

export default function MicroclimateWizardDemo() {
  const [completedSurveyId, setCompletedSurveyId] = React.useState<
    string | null
  >(null);
  const [showWizard, setShowWizard] = React.useState(true);

  const handleComplete = (surveyId: string) => {
    console.log('Survey completed:', surveyId);
    setCompletedSurveyId(surveyId);
    setShowWizard(false);
  };

  const handleCancel = () => {
    console.log('Wizard cancelled');
    setShowWizard(false);
  };

  const handleReset = () => {
    setCompletedSurveyId(null);
    setShowWizard(true);
  };

  if (completedSurveyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            ¡Encuesta Creada!
          </h1>
          <p className="text-gray-600 text-lg">
            Tu encuesta de microclima ha sido publicada exitosamente
          </p>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Survey ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {completedSurveyId}
                  </code>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:scale-105 transition-transform"
                >
                  Crear Nueva Encuesta
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!showWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-4xl font-bold text-gray-900">Wizard Cancelado</h1>
          <p className="text-gray-600 text-lg">
            Puedes reiniciar cuando quieras
          </p>

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:scale-105 transition-transform"
          >
            Reiniciar Wizard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start gap-4">
            <Info className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Microclimate Survey Wizard Demo
              </h2>
              <p className="text-blue-100">
                Complete 4-step wizard with autosave, draft recovery,
                validation, and beautiful UI. Try creating a survey, navigating
                between steps, and testing the autosave feature!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <MicroclimateWizard
        companyId="demo-company-123"
        onComplete={handleComplete}
        onCancel={handleCancel}
        language="es"
      />

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-center mb-8">
          Características del Wizard
        </h3>

        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🔄 Autosave</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Automatic saving every 5 seconds with debouncing
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">📋 Draft Recovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Resume interrupted work with one-click recovery
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">✅ Validation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Step-by-step validation with error feedback
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">📱 Responsive</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Mobile-friendly with compact stepper
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🎨 Animations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Smooth transitions with Framer Motion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">♿ Accessible</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    WCAG AA compliant with keyboard navigation
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integration">
            <Card>
              <CardHeader>
                <CardTitle>Integration Example</CardTitle>
                <CardDescription>
                  How to integrate the wizard in your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-100">
                    {`import MicroclimateWizard from '@/components/microclimate/MicroclimateWizard';

export default function CreateSurveyPage() {
  const handleComplete = (surveyId: string) => {
    // Redirect to survey details
    router.push(\`/surveys/\${surveyId}\`);
  };

  const handleCancel = () => {
    // Return to surveys list
    router.push('/surveys');
  };

  return (
    <MicroclimateWizard
      companyId={currentCompany.id}
      onComplete={handleComplete}
      onCancel={handleCancel}
      language="es"
    />
  );
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="steps">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">1️⃣</span>
                    Step 1: Basic Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Survey title (required)</li>
                    <li>• Description (required)</li>
                    <li>• Language selection</li>
                    <li>• Department targeting</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">2️⃣</span>
                    Step 2: Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Question Library browser</li>
                    <li>• Quick-add frequently used</li>
                    <li>• Custom question creation</li>
                    <li>• Multilingual support (ES/EN)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">3️⃣</span>
                    Step 3: Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• CSV import with validation</li>
                    <li>• Company master data</li>
                    <li>• Audience preview</li>
                    <li>• Deduplication (optional)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">4️⃣</span>
                    Step 4: Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• QR code generation</li>
                    <li>• Tokenized URL creation</li>
                    <li>• Access rules configuration</li>
                    <li>• Timezone-aware scheduling</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
