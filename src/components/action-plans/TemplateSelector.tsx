'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Star, Users } from 'lucide-react';

interface ActionPlanTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  kpi_templates: any[];
  qualitative_objective_templates: any[];
  ai_recommendation_templates: string[];
  tags: string[];
  usage_count: number;
  created_by: {
    name: string;
    email: string;
  };
}

interface TemplateSelectorProps {
  onSelect: (template: ActionPlanTemplate | null) => void;
  selected: ActionPlanTemplate | null;
}

export function TemplateSelector({
  onSelect,
  selected,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ActionPlanTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (showTemplates) {
      fetchTemplates();
    }
  }, [showTemplates, selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/action-plans/templates?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const handleTemplateSelect = (template: ActionPlanTemplate) => {
    if (selected?.id === template.id) {
      onSelect(null);
    } else {
      onSelect(template);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center"
        >
          <FileText className="w-4 h-4 mr-2" />
          {showTemplates ? 'Hide Templates' : 'Browse Templates'}
        </Button>

        {selected && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <FileText className="w-3 h-3 mr-1" />
              {selected.name}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selected?.id === template.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:border-blue-300'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        {selected?.id === template.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {template.usage_count} uses
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {template.kpi_templates.length > 0 && (
                          <div className="flex items-center text-blue-600">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                            {template.kpi_templates.length} KPI
                            {template.kpi_templates.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        {template.qualitative_objective_templates.length >
                          0 && (
                          <div className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                            {template.qualitative_objective_templates.length}{' '}
                            Objective
                            {template.qualitative_objective_templates.length !==
                            1
                              ? 's'
                              : ''}
                          </div>
                        )}
                        {template.ai_recommendation_templates.length > 0 && (
                          <div className="flex items-center text-violet-600">
                            <div className="w-2 h-2 bg-violet-500 rounded-full mr-2" />
                            {template.ai_recommendation_templates.length} AI
                            Recommendation
                            {template.ai_recommendation_templates.length !== 1
                              ? 's'
                              : ''}
                          </div>
                        )}
                      </div>

                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No templates found</p>
                <p className="text-sm">
                  Try adjusting your search or category filter
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
