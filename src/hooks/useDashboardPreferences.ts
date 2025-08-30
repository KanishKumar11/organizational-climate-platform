/**
 * Hook for managing dashboard preferences and customization
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardLayout,
  DashboardWidget,
} from '@/components/dashboard/DashboardCustomization';

export interface DashboardPreferences {
  theme: string;
  layout_type: 'grid' | 'list' | 'masonry';
  columns: number;
  auto_refresh: boolean;
  refresh_interval: number;
  show_animations: boolean;
  compact_mode: boolean;
  default_date_range: string;
  widget_preferences: Record<string, any>;
  notification_preferences: {
    show_alerts: boolean;
    show_insights: boolean;
    show_deadlines: boolean;
  };
  export_preferences: {
    default_format: string;
    include_charts: boolean;
    include_data: boolean;
  };
}

interface UseDashboardPreferencesReturn {
  preferences: DashboardPreferences | null;
  layouts: DashboardLayout[];
  currentLayout: DashboardLayout | null;
  loading: boolean;
  error: string | null;

  // Preference actions
  updatePreferences: (updates: Partial<DashboardPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;

  // Layout actions
  saveLayout: (layout: Partial<DashboardLayout>) => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  setCurrentLayout: (layout: DashboardLayout) => void;

  // Widget actions
  updateWidgetPreferences: (
    widgetId: string,
    preferences: any
  ) => Promise<void>;

  // Export/Import
  exportPreferences: () => void;
  importPreferences: (data: any) => Promise<void>;
}

export function useDashboardPreferences(): UseDashboardPreferencesReturn {
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(
    null
  );
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayoutState] =
    useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
    fetchLayouts();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/preferences');
      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
      } else {
        setError(data.error || 'Failed to fetch preferences');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch preferences'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLayouts = async () => {
    try {
      const response = await fetch('/api/dashboard/layouts');
      const data = await response.json();

      if (data.success) {
        setLayouts(data.layouts);

        // Set current layout to default if none is set
        const defaultLayout = data.layouts.find(
          (l: DashboardLayout) => l.is_default
        );
        if (defaultLayout && !currentLayout) {
          setCurrentLayoutState(defaultLayout);
        }
      }
    } catch (err) {
      console.error('Failed to fetch layouts:', err);
    }
  };

  const updatePreferences = useCallback(
    async (updates: Partial<DashboardPreferences>) => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.success) {
          setPreferences(data.preferences);
        } else {
          setError(data.error || 'Failed to update preferences');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update preferences'
        );
      }
    },
    []
  );

  const resetPreferences = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Send empty object to get defaults
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
      } else {
        setError(data.error || 'Failed to reset preferences');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reset preferences'
      );
    }
  }, []);

  const saveLayout = useCallback(async (layout: Partial<DashboardLayout>) => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout),
      });

      const data = await response.json();

      if (data.success) {
        setLayouts((prev) => [...prev, data.layout]);
        if (data.layout.is_default) {
          setCurrentLayoutState(data.layout);
        }
      } else {
        setError(data.error || 'Failed to save layout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout');
    }
  }, []);

  const loadLayout = useCallback(
    async (layoutId: string) => {
      try {
        setError(null);
        const layout = layouts.find((l) => l.id === layoutId);
        if (layout) {
          setCurrentLayoutState(layout);

          // Update user's default layout preference
          await updatePreferences({
            layout_type: layout.layout_type,
            columns: layout.columns,
            theme: layout.theme,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load layout');
      }
    },
    [layouts, updatePreferences]
  );

  const deleteLayout = useCallback(
    async (layoutId: string) => {
      try {
        setError(null);
        const response = await fetch(`/api/dashboard/layouts?id=${layoutId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          setLayouts((prev) => prev.filter((l) => l.id !== layoutId));

          // If deleted layout was current, switch to default
          if (currentLayout?.id === layoutId) {
            const defaultLayout = layouts.find(
              (l) => l.is_default && l.id !== layoutId
            );
            if (defaultLayout) {
              setCurrentLayoutState(defaultLayout);
            }
          }
        } else {
          setError(data.error || 'Failed to delete layout');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete layout'
        );
      }
    },
    [layouts, currentLayout]
  );

  const setCurrentLayout = useCallback((layout: DashboardLayout) => {
    setCurrentLayoutState(layout);
  }, []);

  const updateWidgetPreferences = useCallback(
    async (widgetId: string, widgetPreferences: any) => {
      if (!preferences) return;

      const updatedWidgetPreferences = {
        ...preferences.widget_preferences,
        [widgetId]: widgetPreferences,
      };

      await updatePreferences({
        widget_preferences: updatedWidgetPreferences,
      });
    },
    [preferences, updatePreferences]
  );

  const exportPreferences = useCallback(() => {
    if (!preferences || !currentLayout) return;

    const exportData = {
      preferences,
      currentLayout,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `dashboard-preferences-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [preferences, currentLayout]);

  const importPreferences = useCallback(
    async (data: any) => {
      try {
        setError(null);

        if (data.preferences) {
          await updatePreferences(data.preferences);
        }

        if (data.currentLayout) {
          await saveLayout({
            ...data.currentLayout,
            name: `${data.currentLayout.name} (Imported)`,
            is_default: false,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to import preferences'
        );
      }
    },
    [updatePreferences, saveLayout]
  );

  return {
    preferences,
    layouts,
    currentLayout,
    loading,
    error,

    updatePreferences,
    resetPreferences,

    saveLayout,
    loadLayout,
    deleteLayout,
    setCurrentLayout,

    updateWidgetPreferences,

    exportPreferences,
    importPreferences,
  };
}


