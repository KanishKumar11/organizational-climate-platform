'use client';

import React, { useState } from 'react';
import { useAutosave, generateSessionId } from '@/hooks/useAutosave';
import {
  AutosaveIndicator,
  AutosaveBadge,
} from '@/components/microclimate/AutosaveIndicator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

/**
 * Autosave Demo Component
 *
 * Interactive demo showcasing the autosave system features:
 * - Real-time autosave with debouncing
 * - Status indicators (animated)
 * - Force save functionality
 * - Error simulation
 * - Conflict simulation
 * - Retry mechanism
 */

export function AutosaveDemo() {
  const [draftId] = useState('demo-draft-001');
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    survey_type: 'microclimate' as const,
    language: 'es' as const,
  });

  // Stats for demo
  const [mockServerVersion, setMockServerVersion] = useState(1);
  const [simulateError, setSimulateError] = useState(false);
  const [simulateConflict, setSimulateConflict] = useState(false);

  // Initialize autosave
  const {
    save,
    forceSave,
    retry,
    resetVersion,
    status,
    version,
    lastSavedAt,
    saveCount,
    isSaving,
    hasError,
    hasConflict,
  } = useAutosave(draftId, {
    debounceMs: 3000, // 3 seconds for demo
    onSuccess: (data) => {
      console.log('✅ Autosave successful:', data);
    },
    onError: (error) => {
      console.error('❌ Autosave error:', error);
    },
    onConflict: (serverVersion) => {
      console.warn('⚠️ Version conflict! Server version:', serverVersion);
      setMockServerVersion(serverVersion);
    },
  });

  // Handle field changes
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Trigger autosave
    save({
      current_step: currentStep,
      step1_data: {
        ...formData,
        [field]: value,
      },
      last_edited_field: field,
    });
  };

  // Handle force save
  const handleForceSave = () => {
    forceSave({
      current_step: currentStep,
      step1_data: formData,
    });
  };

  // Simulate error
  const toggleErrorSimulation = () => {
    setSimulateError(!simulateError);
  };

  // Simulate conflict
  const triggerConflict = () => {
    setMockServerVersion((prev) => prev + 1);
    setSimulateConflict(true);
    setTimeout(() => setSimulateConflict(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Autoguardado
            </h1>
            <p className="text-gray-600 mt-1">
              Demo interactiva con indicadores visuales y control de versiones
            </p>
          </div>

          {/* Compact status badge */}
          <AutosaveBadge
            status={status}
            lastSavedAt={lastSavedAt}
            language="es"
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Estado Actual</CardDescription>
              <CardTitle className="text-2xl">
                {status === 'idle' && 'Inactivo'}
                {status === 'saving' && 'Guardando'}
                {status === 'saved' && 'Guardado'}
                {status === 'error' && 'Error'}
                {status === 'conflict' && 'Conflicto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status === 'saving' && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                )}
                {status === 'saved' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                {status === 'error' && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                {status === 'conflict' && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-sm text-gray-600">
                  Versión: {version}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Guardados</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">
                {saveCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {saveCount === 0 && 'Sin guardados aún'}
                {saveCount === 1 && '1 guardado automático'}
                {saveCount > 1 && `${saveCount} guardados automáticos`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Último Guardado</CardDescription>
              <CardTitle className="text-lg">
                {lastSavedAt
                  ? new Date(lastSavedAt).toLocaleTimeString('es-ES')
                  : 'Nunca'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {lastSavedAt && (
                  <span>
                    {Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)}s
                    atrás
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Paso Actual</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {currentStep} / 4
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded ${
                      step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Formulario de Prueba</CardTitle>
                    <CardDescription>
                      Escribe en los campos para activar el autoguardado
                    </CardDescription>
                  </div>
                  <Badge variant={isSaving ? 'default' : 'secondary'}>
                    {isSaving ? 'Guardando...' : 'Sincronizado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la Encuesta</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Encuesta de Clima Organizacional"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500">
                    Autoguardado después de 3 segundos sin escribir
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el propósito de la encuesta..."
                    value={formData.description}
                    onChange={(e) =>
                      handleChange('description', e.target.value)
                    }
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleForceSave}
                    disabled={isSaving}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Ahora
                  </Button>

                  {hasError && (
                    <Button
                      onClick={retry}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reintentar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls & Info */}
          <div className="space-y-6">
            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controles de Prueba</CardTitle>
                <CardDescription>Simula diferentes escenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={triggerConflict}
                  variant="outline"
                  className="w-full"
                  disabled={simulateConflict}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Simular Conflicto
                </Button>

                <Button
                  onClick={toggleErrorSimulation}
                  variant="outline"
                  className="w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {simulateError ? 'Desactivar' : 'Activar'} Errores
                </Button>

                <Button
                  onClick={() => resetVersion(mockServerVersion)}
                  variant="outline"
                  className="w-full"
                  disabled={!hasConflict}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resolver Conflicto
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">🔄 Autoguardado</h4>
                  <p className="text-gray-600">
                    Los cambios se guardan automáticamente 3 segundos después de
                    dejar de escribir.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔢 Control de Versiones</h4>
                  <p className="text-gray-600">
                    Cada guardado incrementa la versión para prevenir
                    conflictos.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">⚡ Guardado Forzado</h4>
                  <p className="text-gray-600">
                    Usa "Guardar Ahora" para guardar inmediatamente sin esperar.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">⚠️ Manejo de Errores</h4>
                  <p className="text-gray-600">
                    Si falla el guardado, puedes reintentar manualmente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Developer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Estado del Sistema (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="state" className="w-full">
              <TabsList>
                <TabsTrigger value="state">Estado</TabsTrigger>
                <TabsTrigger value="data">Datos</TabsTrigger>
                <TabsTrigger value="config">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="state" className="space-y-2">
                <div className="font-mono text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  <pre>
                    {JSON.stringify(
                      {
                        status,
                        version,
                        saveCount,
                        isSaving,
                        hasError,
                        hasConflict,
                        lastSavedAt: lastSavedAt?.toISOString(),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-2">
                <div className="font-mono text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  <pre>
                    {JSON.stringify(
                      {
                        current_step: currentStep,
                        step1_data: formData,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-2">
                <div className="font-mono text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  <pre>
                    {JSON.stringify(
                      {
                        draftId,
                        debounceMs: 3000,
                        enabled: true,
                        mockServerVersion,
                        simulateError,
                        simulateConflict,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Floating autosave indicator */}
      <AutosaveIndicator
        status={status}
        lastSavedAt={lastSavedAt}
        saveCount={saveCount}
        onRetry={retry}
        language="es"
      />
    </div>
  );
}
