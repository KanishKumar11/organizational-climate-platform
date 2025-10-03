// Component Import Test
// This file verifies all microclimate components can be imported without errors

// Core Wizard
export { MicroclimateWizard } from './components/microclimate/MicroclimateWizard';

// Step Components
export { CSVImporter } from './components/microclimate/CSVImporter';
export { ColumnMapper } from './components/microclimate/ColumnMapper';
export { ValidationPanel } from './components/microclimate/ValidationPanel';
export { AudiencePreviewCard } from './components/microclimate/AudiencePreviewCard';
export { ManualEmployeeEntry } from './components/microclimate/ManualEmployeeEntry';
export { QRCodeGenerator } from './components/microclimate/QRCodeGenerator';
export { ScheduleConfig } from './components/microclimate/ScheduleConfig';
export { DistributionPreview } from './components/microclimate/DistributionPreview';

// Question Library
export { QuestionLibraryBrowser } from './components/microclimate/QuestionLibraryBrowser';
export { QuickAddPanel } from './components/microclimate/QuickAddPanel';
export { MultilingualQuestionEditor } from './components/microclimate/MultilingualQuestionEditor';
export { QuestionPreviewModal } from './components/microclimate/QuestionPreviewModal';

// Auto-save & Draft Recovery
export { AutosaveIndicator } from './components/microclimate/AutosaveIndicator';
export { DraftRecoveryBanner, DraftRecoveryContainer } from './components/microclimate/DraftRecoveryBanner';

// Wizard Navigation
export { WizardStepper, CompactWizardStepper } from './components/microclimate/WizardStepper';

// Hooks
export { useAutosave } from './hooks/useAutosave';
export { useDraftRecovery } from './hooks/useDraftRecovery';
export { useWizardNavigation } from './hooks/useWizardNavigation';
export { useQuestionLibrary } from './hooks/useQuestionLibrary';

// ✅ If this file compiles without errors, all components are properly exported
console.log('✅ All microclimate components imported successfully!');
