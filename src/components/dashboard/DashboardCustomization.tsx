/**
 * Dashboard customization and personalization component
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Layout,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  Share,
  Palette,
  Grid,
  List,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  visible: boolean;
  config: Record<string, any>;
  module: 'survey' | 'microclimate' | 'ai' | 'action';
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout_type: 'grid' | 'list' | 'masonry';
  columns: number;
  theme: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  is_shared: boolean;
}

interface DashboardCustomizationProps {
  userRole: string;
  currentLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  availableWidgets: DashboardWidget[];
}

const WIDGET_SIZES = {
  small: { width: 1, height: 1, label: 'Small (1x1)' },
  medium: { width: 2, height: 1, label: 'Medium (2x1)' },
  large: { width: 2, height: 2, label: 'Large (2x2)' },
  full: { width: 4, height: 1, label: 'Full Width (4x1)' },
};

const LAYOUT_TYPES = {
  grid: { label: 'Grid Layout', icon: Grid },
  list: { label: 'List Layout', icon: List },
  masonry: { label: 'Masonry Layout', icon: Layout },
};

const THEMES = {
  default: {
    label: 'Default',
    colors: ['#2563EB', '#059669', '#7C3AED', '#EA580C'],
  },
  dark: { label: 'Dark', colors: ['#1E293B', '#0F172A', '#334155', '#475569'] },
  light: {
    label: 'Light',
    colors: ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1'],
  },
  colorful: {
    label: 'Colorful',
    colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'],
  },
};

export function DashboardCustomization({
  userRole,
  currentLayout,
  onLayoutChange,
  availableWidgets,
}: DashboardCustomizationProps) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<DashboardLayout>(currentLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSavedLayouts();
  }, []);

  const fetchSavedLayouts = async () => {
    try {
      const response = await fetch('/api/dashboard/layouts');
      if (response.ok) {
        const data = await response.json();
        setSavedLayouts(data.layouts || []);
      }
    } catch (error) {
      console.error('Failed to fetch saved layouts:', error);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = layout.widgets.findIndex((w) => w.id === active.id);
      const newIndex = layout.widgets.findIndex((w) => w.id === over.id);

      const newWidgets = arrayMove(layout.widgets, oldIndex, newIndex);
      const updatedLayout = { ...layout, widgets: newWidgets };
      setLayout(updatedLayout);
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = layout.widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
    );
    const updatedLayout = { ...layout, widgets: updatedWidgets };
    setLayout(updatedLayout);
  };

  const updateWidgetSize = (
    widgetId: string,
    size: keyof typeof WIDGET_SIZES
  ) => {
    const updatedWidgets = layout.widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, size } : widget
    );
    const updatedLayout = { ...layout, widgets: updatedWidgets };
    setLayout(updatedLayout);
  };

  const addWidget = (widgetType: string) => {
    const availableWidget = availableWidgets.find((w) => w.type === widgetType);
    if (!availableWidget) return;

    const newWidget: DashboardWidget = {
      ...availableWidget,
      id: `${widgetType}-${Date.now()}`,
      position: { x: 0, y: layout.widgets.length },
      visible: true,
    };

    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, newWidget],
    };
    setLayout(updatedLayout);
  };

  const removeWidget = (widgetId: string) => {
    const updatedWidgets = layout.widgets.filter((w) => w.id !== widgetId);
    const updatedLayout = { ...layout, widgets: updatedWidgets };
    setLayout(updatedLayout);
  };

  const saveLayout = async (layoutData: Partial<DashboardLayout>) => {
    try {
      const response = await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...layout,
          ...layoutData,
          updated_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const savedLayout = await response.json();
        setSavedLayouts((prev) => [...prev, savedLayout]);
        onLayoutChange(savedLayout);
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  const loadLayout = (layoutId: string) => {
    const savedLayout = savedLayouts.find((l) => l.id === layoutId);
    if (savedLayout) {
      setLayout(savedLayout);
      onLayoutChange(savedLayout);
    }
  };

  const exportLayout = () => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `dashboard-layout-${layout.name.replace(/\s+/g, '-').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedLayout = JSON.parse(e.target?.result as string);
        setLayout({
          ...importedLayout,
          id: `imported-${Date.now()}`,
          name: `${importedLayout.name} (Imported)`,
        });
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    const defaultLayout = savedLayouts.find((l) => l.is_default);
    if (defaultLayout) {
      setLayout(defaultLayout);
      onLayoutChange(defaultLayout);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customization Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dashboard Customization</h3>
          <p className="text-sm text-muted-foreground">
            Personalize your dashboard layout and widgets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isCustomizing ? 'Exit Customize' : 'Customize'}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Layout className="h-4 w-4 mr-2" />
                Manage Layouts
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Dashboard Layout Management</DialogTitle>
              </DialogHeader>
              <LayoutManager
                currentLayout={layout}
                savedLayouts={savedLayouts}
                onSave={saveLayout}
                onLoad={loadLayout}
                onExport={exportLayout}
                onImport={importLayout}
                onReset={resetToDefault}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Customization Panel */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg p-4 bg-muted/50"
          >
            <Tabs defaultValue="widgets" className="space-y-4">
              <TabsList>
                <TabsTrigger value="widgets">Widgets</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
              </TabsList>

              <TabsContent value="widgets" className="space-y-4">
                <WidgetCustomization
                  widgets={layout.widgets}
                  availableWidgets={availableWidgets}
                  onToggleVisibility={toggleWidgetVisibility}
                  onUpdateSize={updateWidgetSize}
                  onAddWidget={addWidget}
                  onRemoveWidget={removeWidget}
                />
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <LayoutCustomization
                  layout={layout}
                  onLayoutChange={setLayout}
                />
              </TabsContent>

              <TabsContent value="theme" className="space-y-4">
                <ThemeCustomization
                  layout={layout}
                  onLayoutChange={setLayout}
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={resetToDefault}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomizing(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => onLayoutChange(layout)}>
                  <Save className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Drag and Drop Area */}
      {isCustomizing && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layout.widgets.map((w) => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {layout.widgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isCustomizing={isCustomizing}
                  onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                  onRemove={() => removeWidget(widget.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface SortableWidgetProps {
  widget: DashboardWidget;
  isCustomizing: boolean;
  onToggleVisibility: () => void;
  onRemove: () => void;
}

function SortableWidget({
  widget,
  isCustomizing,
  onToggleVisibility,
  onRemove,
}: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const moduleColors = getModuleColors(widget.module);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg bg-background',
        !widget.visible && 'opacity-50',
        isCustomizing && 'border-dashed'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: moduleColors.primary }}
      />

      <div className="flex-1">
        <h4 className="font-medium">{widget.title}</h4>
        <p className="text-sm text-muted-foreground">{widget.description}</p>
      </div>

      <Badge variant="outline" className="text-xs">
        {WIDGET_SIZES[widget.size].label}
      </Badge>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          className="h-8 w-8 p-0"
        >
          {widget.visible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface WidgetCustomizationProps {
  widgets: DashboardWidget[];
  availableWidgets: DashboardWidget[];
  onToggleVisibility: (id: string) => void;
  onUpdateSize: (id: string, size: keyof typeof WIDGET_SIZES) => void;
  onAddWidget: (type: string) => void;
  onRemoveWidget: (id: string) => void;
}

function WidgetCustomization({
  widgets,
  availableWidgets,
  onToggleVisibility,
  onUpdateSize,
  onAddWidget,
  onRemoveWidget,
}: WidgetCustomizationProps) {
  const visibleWidgets = widgets.filter((w) => w.visible);
  const hiddenWidgets = widgets.filter((w) => !w.visible);

  return (
    <div className="space-y-6">
      {/* Add New Widgets */}
      <div>
        <h4 className="font-medium mb-3">Add Widgets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {availableWidgets.map((widget) => {
            const moduleColors = getModuleColors(widget.module);
            const isAdded = widgets.some((w) => w.type === widget.type);

            return (
              <Button
                key={widget.type}
                variant="outline"
                size="sm"
                onClick={() => onAddWidget(widget.type)}
                disabled={isAdded}
                className="flex items-center gap-2 h-auto p-3"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: moduleColors.primary }}
                />
                <div className="text-left">
                  <div className="font-medium text-xs">{widget.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {widget.module}
                  </div>
                </div>
                {isAdded && <Plus className="h-3 w-3 ml-auto opacity-50" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Visible Widgets */}
      <div>
        <h4 className="font-medium mb-3">
          Visible Widgets ({visibleWidgets.length})
        </h4>
        <div className="space-y-2">
          {visibleWidgets.map((widget) => (
            <WidgetConfigItem
              key={widget.id}
              widget={widget}
              onToggleVisibility={() => onToggleVisibility(widget.id)}
              onUpdateSize={(size) => onUpdateSize(widget.id, size)}
              onRemove={() => onRemoveWidget(widget.id)}
            />
          ))}
        </div>
      </div>

      {/* Hidden Widgets */}
      {hiddenWidgets.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">
            Hidden Widgets ({hiddenWidgets.length})
          </h4>
          <div className="space-y-2">
            {hiddenWidgets.map((widget) => (
              <WidgetConfigItem
                key={widget.id}
                widget={widget}
                onToggleVisibility={() => onToggleVisibility(widget.id)}
                onUpdateSize={(size) => onUpdateSize(widget.id, size)}
                onRemove={() => onRemoveWidget(widget.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface WidgetConfigItemProps {
  widget: DashboardWidget;
  onToggleVisibility: () => void;
  onUpdateSize: (size: keyof typeof WIDGET_SIZES) => void;
  onRemove: () => void;
}

function WidgetConfigItem({
  widget,
  onToggleVisibility,
  onUpdateSize,
  onRemove,
}: WidgetConfigItemProps) {
  const moduleColors = getModuleColors(widget.module);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg',
        !widget.visible && 'opacity-50 bg-muted/50'
      )}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: moduleColors.primary }}
      />

      <div className="flex-1">
        <h5 className="font-medium text-sm">{widget.title}</h5>
        <p className="text-xs text-muted-foreground">{widget.description}</p>
      </div>

      <Select value={widget.size} onValueChange={onUpdateSize}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(WIDGET_SIZES).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Switch checked={widget.visible} onCheckedChange={onToggleVisibility} />

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface LayoutCustomizationProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}

function LayoutCustomization({
  layout,
  onLayoutChange,
}: LayoutCustomizationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Layout Type</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(LAYOUT_TYPES).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = layout.layout_type === key;

            return (
              <Button
                key={key}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() =>
                  onLayoutChange({ ...layout, layout_type: key as any })
                }
                className="flex flex-col items-center gap-2 h-auto p-4"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="columns">Grid Columns</Label>
        <Select
          value={layout.columns.toString()}
          onValueChange={(value) =>
            onLayoutChange({ ...layout, columns: parseInt(value) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
            <SelectItem value="6">6 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface ThemeCustomizationProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}

function ThemeCustomization({
  layout,
  onLayoutChange,
}: ThemeCustomizationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Theme</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(THEMES).map(([key, config]) => {
            const isSelected = layout.theme === key;

            return (
              <Button
                key={key}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onLayoutChange({ ...layout, theme: key })}
                className="flex items-center gap-3 h-auto p-3"
              >
                <div className="flex gap-1">
                  {config.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface LayoutManagerProps {
  currentLayout: DashboardLayout;
  savedLayouts: DashboardLayout[];
  onSave: (layout: Partial<DashboardLayout>) => void;
  onLoad: (layoutId: string) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

function LayoutManager({
  currentLayout,
  savedLayouts,
  onSave,
  onLoad,
  onExport,
  onImport,
  onReset,
}: LayoutManagerProps) {
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');

  return (
    <div className="space-y-6">
      {/* Save Current Layout */}
      <div className="space-y-3">
        <h4 className="font-medium">Save Current Layout</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="layout-name">Layout Name</Label>
            <Input
              id="layout-name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="My Custom Layout"
            />
          </div>
          <div>
            <Label htmlFor="layout-description">Description</Label>
            <Input
              id="layout-description"
              value={layoutDescription}
              onChange={(e) => setLayoutDescription(e.target.value)}
              placeholder="Description of this layout"
            />
          </div>
        </div>
        <Button
          onClick={() =>
            onSave({ name: layoutName, description: layoutDescription })
          }
          disabled={!layoutName}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Layout
        </Button>
      </div>

      {/* Saved Layouts */}
      <div className="space-y-3">
        <h4 className="font-medium">Saved Layouts</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {savedLayouts.map((layout) => (
            <div
              key={layout.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h5 className="font-medium">{layout.name}</h5>
                <p className="text-sm text-muted-foreground">
                  {layout.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {layout.is_default && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  {layout.is_shared && <Badge variant="outline">Shared</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {new Date(layout.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoad(layout.id)}
              >
                Load
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Import/Export */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <div>
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
            id="import-layout"
          />
          <Button variant="outline" asChild>
            <label htmlFor="import-layout" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </label>
          </Button>
        </div>

        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
