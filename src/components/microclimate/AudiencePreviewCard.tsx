'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Building2, MapPin, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

/**
 * Audience Preview Card Component
 * 
 * Shows statistics and breakdown of target audience.
 * 
 * Features:
 * - Total employee count
 * - Breakdown by department
 * - Breakdown by location
 * - Preview sample recipients
 * - Visual charts and progress bars
 * 
 * @param employees - Array of target employees
 * @param language - Display language
 */

interface AudiencePreviewCardProps {
  employees: TargetEmployee[];
  language?: 'es' | 'en';
}

export interface TargetEmployee {
  email: string;
  name: string;
  department?: string;
  location?: string;
  position?: string;
  employeeId?: string;
}

export function AudiencePreviewCard({
  employees,
  language = 'es',
}: AudiencePreviewCardProps) {
  const [showAll, setShowAll] = useState(false);

  const t = language === 'es' ? {
    title: 'Vista Previa de Audiencia',
    description: 'Estadísticas de los destinatarios de la encuesta',
    total: 'Total de Empleados',
    byDepartment: 'Por Departamento',
    byLocation: 'Por Ubicación',
    byPosition: 'Por Puesto',
    sampleRecipients: 'Destinatarios de Muestra',
    showAll: 'Ver todos',
    showLess: 'Ver menos',
    noData: 'Sin datos',
    unknown: 'No especificado',
  } : {
    title: 'Audience Preview',
    description: 'Statistics of survey recipients',
    total: 'Total Employees',
    byDepartment: 'By Department',
    byLocation: 'By Location',
    byPosition: 'By Position',
    sampleRecipients: 'Sample Recipients',
    showAll: 'Show all',
    showLess: 'Show less',
    noData: 'No data',
    unknown: 'Unspecified',
  };

  const stats = useMemo(() => {
    const departmentMap = new Map<string, number>();
    const locationMap = new Map<string, number>();
    const positionMap = new Map<string, number>();

    employees.forEach(emp => {
      const dept = emp.department || t.unknown;
      const loc = emp.location || t.unknown;
      const pos = emp.position || t.unknown;

      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
      locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
      positionMap.set(pos, (positionMap.get(pos) || 0) + 1);
    });

    const sortByCount = (map: Map<string, number>) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
      total: employees.length,
      byDepartment: sortByCount(departmentMap),
      byLocation: sortByCount(locationMap),
      byPosition: sortByCount(positionMap),
    };
  }, [employees]);

  const renderBreakdownItem = (
    label: string,
    count: number,
    total: number,
    icon: React.ReactNode,
    color: string
  ) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </div>
          <Badge variant="outline">{count}</Badge>
        </div>
        <Progress value={percentage} className={cn('h-2', color)} />
        <p className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</p>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Count */}
        <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t.total}</p>
              <p className="text-4xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* By Department */}
        {stats.byDepartment.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t.byDepartment}
            </h4>
            {stats.byDepartment.map(([dept, count]) =>
              renderBreakdownItem(
                dept,
                count,
                stats.total,
                <Building2 className="w-4 h-4 text-blue-600" />,
                'bg-blue-600'
              )
            )}
          </div>
        )}

        {/* By Location */}
        {stats.byLocation.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t.byLocation}
            </h4>
            {stats.byLocation.map(([loc, count]) =>
              renderBreakdownItem(
                loc,
                count,
                stats.total,
                <MapPin className="w-4 h-4 text-green-600" />,
                'bg-green-600'
              )
            )}
          </div>
        )}

        {/* By Position */}
        {stats.byPosition.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {t.byPosition}
            </h4>
            {stats.byPosition.slice(0, 3).map(([pos, count]) =>
              renderBreakdownItem(
                pos,
                count,
                stats.total,
                <Briefcase className="w-4 h-4 text-purple-600" />,
                'bg-purple-600'
              )
            )}
          </div>
        )}

        {/* Sample Recipients */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t.sampleRecipients}
          </h4>
          <div className="space-y-2">
            {employees.slice(0, showAll ? undefined : 5).map((emp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {emp.name}
                    </p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                  <div className="text-right">
                    {emp.department && (
                      <Badge variant="outline" className="text-xs mb-1">
                        {emp.department}
                      </Badge>
                    )}
                    {emp.location && (
                      <p className="text-xs text-gray-500">{emp.location}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {employees.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {showAll ? t.showLess : `${t.showAll} (${employees.length - 5} more)`}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
