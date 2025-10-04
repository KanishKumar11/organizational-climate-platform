'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MicroclimateWizard } from '@/components/microclimate/MicroclimateWizard';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loading } from '@/components/ui/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Production Microclimate Survey Creation Page (Wizard Version)
 *
 * This page provides the full-featured wizard for creating
 * microclimate surveys with all Phase 1-3 features implemented.
 *
 * Route: /microclimates/create-wizard
 *
 * Features:
 * ✅ Auto-save with draft recovery
 * ✅ Company searchable dropdown with 1000+ companies
 * ✅ CSV department import with 4-stage validation
 * ✅ Bulk question selection from library
 * ✅ Drag-and-drop question reordering
 * ✅ Reminder configuration with email templates
 * ✅ Distribution mode selector (tokenized/open)
 * ✅ Full validation before submission
 * ✅ Bilingual support (Spanish/English)
 */
export default function CreateMicroclimateWizardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (surveyData: any) => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    console.log('📤 Submitting microclimate survey:', surveyData);

    try {
      // Transform wizard data to API format
      const payload = {
        title: surveyData.step1Data.title,
        description: surveyData.step1Data.description,

        // Questions from Step 2
        questions: [
          // Library questions
          ...surveyData.step2Data.questionIds.map((id: string) => ({
            library_question_id: id,
            source: 'library',
          })),
          // Custom questions
          ...surveyData.step2Data.customQuestions.map((q: any) => ({
            text_es: q.text_es,
            text_en: q.text_en,
            type: q.type,
            options_es: q.options_es,
            options_en: q.options_en,
            category: q.category,
            required: q.required !== false,
            source: 'custom',
          })),
        ],

        // Targeting from Step 3
        targeting: {
          mode: surveyData.step3Data.targetingMode,
          department_ids: surveyData.step3Data.selectedDepartmentIds || [],
          employee_emails: surveyData.step3Data.targetEmployees || [],
          include_managers: true,
        },

        // Scheduling from Step 4
        scheduling: {
          start_time: surveyData.step4Data.schedule.startDate,
          duration_minutes: surveyData.step4Data.schedule.duration || 30,
          timezone:
            surveyData.step4Data.schedule.timezone || 'America/Mexico_City',
          auto_close: true,
        },

        // Distribution configuration
        distribution: surveyData.step4Data.schedule.distribution || {
          mode: 'tokenized',
          securityAcknowledged: true,
          allowAnonymous: false,
          generateQRCode: true,
        },

        // Reminders configuration
        reminders: surveyData.step4Data.schedule.reminders || {
          enabled: false,
          intervals: [],
        },

        // Metadata
        language: surveyData.step1Data.language || 'es',
        type: surveyData.step1Data.surveyType || 'microclimate',
        company_id: surveyData.step1Data.companyId,
        status: 'draft', // Start as draft
      };

      console.log('📦 Transformed payload:', payload);

      const response = await fetch('/api/microclimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log('✅ Survey created:', data);

        toast.success('¡Encuesta de microclima creada exitosamente!', {
          description: `ID: ${data._id}`,
          duration: 5000,
        });

        // Redirect to survey details page
        router.push(`/microclimates/${data._id}`);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);

        toast.error('Error al crear la encuesta', {
          description:
            errorData.error || errorData.message || 'Error desconocido',
          duration: 7000,
        });
      }
    } catch (error) {
      console.error('💥 Unexpected error creating microclimate:', error);

      toast.error('Error inesperado', {
        description:
          error instanceof Error ? error.message : 'Por favor intenta de nuevo',
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      confirm('¿Estás seguro de cancelar? Se perderá el progreso no guardado.')
    ) {
      router.push('/microclimates');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-gray-600">
              Por favor inicia sesión para crear encuestas de microclima.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check permissions
  const canCreateMicroclimates = [
    'super_admin',
    'company_admin',
    'leader',
  ].includes(user.role);

  if (!canCreateMicroclimates) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Permisos Insuficientes
            </h3>
            <p className="text-gray-600">
              No tienes permiso para crear encuestas de microclima.
              <br />
              Contacta a tu administrador si necesitas acceso.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MicroclimateWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
        language="es"
      />
    </DashboardLayout>
  );
}
