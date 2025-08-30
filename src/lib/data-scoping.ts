/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole } from '../types/user';
import AuditService from './audit-service';
import { connectDB } from './db';

export interface ScopeContext {
  user_id: string;
  role: UserRole;
  company_id: string;
  department_id: string;
  permissions: string[];
}

export interface ScopeFilter {
  field: string;
  operator: 'equals' | 'in' | 'not_equals' | 'exists';
  value: unknown;
  required: boolean;
}

export interface ScopeValidationResult {
  allowed: boolean;
  filters: ScopeFilter[];
  reason?: string;
  audit_required: boolean;
}

export interface ScopingRule {
  role: UserRole;
  conditions: ScopeCondition[];
  filters: ScopeFilter[];
  permissions_required?: string[];
}

export interface ScopeCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value?: unknown;
}

export interface DataScopeConfig {
  resource_type: string;
  scoping_rules: ScopingRule[];
  audit_access: boolean;
  cache_ttl?: number;
}

export class DataScopingService {
  private static instance: DataScopingService;
  private scopeConfigs: Map<string, DataScopeConfig> = new Map();
  private auditService: AuditService;

  private constructor() {
    this.auditService = AuditService.getInstance();
    this.initializeDefaultConfigs();
  }

  public static getInstance(): DataScopingService {
    if (!DataScopingService.instance) {
      DataScopingService.instance = new DataScopingService();
    }
    return DataScopingService.instance;
  }

  private initializeDefaultConfigs(): void {
    // Survey scoping configuration
    this.scopeConfigs.set('surveys', {
      resource_type: 'surveys',
      audit_access: true,
      cache_ttl: 300,
      scoping_rules: [
        {
          role: 'super_admin',
          conditions: [],
          filters: [], // No restrictions for super admin
        },
        {
          role: 'company_admin',
          conditions: [{ field: 'company_id', operator: 'equals' }],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
        {
          role: 'department_admin',
          conditions: [
            { field: 'company_id', operator: 'equals' },
            { field: 'department_id', operator: 'equals' },
          ],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
            {
              field: 'department_id',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
        {
          role: 'employee',
          conditions: [
            { field: 'company_id', operator: 'equals' },
            { field: 'department_id', operator: 'equals' },
          ],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
            {
              field: 'department_id',
              operator: 'equals',
              value: null,
              required: true,
            },
            {
              field: 'status',
              operator: 'equals',
              value: 'active',
              required: true,
            },
          ],
        },
      ],
    });

    // Response scoping configuration
    this.scopeConfigs.set('responses', {
      resource_type: 'responses',
      audit_access: true,
      cache_ttl: 300,
      scoping_rules: [
        {
          role: 'super_admin',
          conditions: [],
          filters: [],
        },
        {
          role: 'company_admin',
          conditions: [{ field: 'company_id', operator: 'equals' }],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
        {
          role: 'department_admin',
          conditions: [
            { field: 'company_id', operator: 'equals' },
            { field: 'department_id', operator: 'equals' },
          ],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
            {
              field: 'department_id',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
        {
          role: 'employee',
          conditions: [{ field: 'user_id', operator: 'equals' }],
          filters: [
            {
              field: 'user_id',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
      ],
    });

    // Action plans scoping configuration
    this.scopeConfigs.set('action_plans', {
      resource_type: 'action_plans',
      audit_access: true,
      cache_ttl: 300,
      scoping_rules: [
        {
          role: 'super_admin',
          conditions: [],
          filters: [],
        },
        {
          role: 'company_admin',
          conditions: [{ field: 'company_id', operator: 'equals' }],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
        {
          role: 'department_admin',
          conditions: [
            { field: 'company_id', operator: 'equals' },
            { field: 'department_id', operator: 'in' },
          ],
          filters: [
            {
              field: 'company_id',
              operator: 'equals',
              value: null,
              required: true,
            },
            {
              field: 'department_id',
              operator: 'in',
              value: null,
              required: true,
            },
          ],
        },
        {
          role: 'employee',
          conditions: [{ field: 'assigned_to', operator: 'equals' }],
          filters: [
            {
              field: 'assigned_to',
              operator: 'equals',
              value: null,
              required: true,
            },
          ],
        },
      ],
    });
  }

  public async validateAccess(
    context: ScopeContext,
    resourceType: string,
    operation: 'read' | 'write' | 'delete' = 'read'
  ): Promise<ScopeValidationResult> {
    const config = this.scopeConfigs.get(resourceType);

    if (!config) {
      await this.auditService.logEvent({
        action: 'read',
        resource: 'user',
        resource_id: resourceType,
        success: false,
        error_message: 'Unknown resource type',
        context: {
          user_id: context.user_id,
          company_id: context.company_id,
          ip_address: '',
        },
        details: { reason: 'Unknown resource type' },
      });

      return {
        allowed: false,
        filters: [],
        reason: `Unknown resource type: ${resourceType}`,
        audit_required: true,
      };
    }

    const rule = config.scoping_rules.find((r) => r.role === context.role);

    if (!rule) {
      await this.auditService.logEvent({
        action: 'read',
        resource: 'user',
        resource_id: resourceType,
        success: false,
        error_message: 'No scoping rule found for role',
        context: {
          user_id: context.user_id,
          company_id: context.company_id,
          ip_address: '',
        },
        details: {
          reason: 'No scoping rule found for role',
          role: context.role,
        },
      });

      return {
        allowed: false,
        filters: [],
        reason: `No scoping rule found for role: ${context.role}`,
        audit_required: true,
      };
    }

    // Check permissions if required
    if (rule.permissions_required) {
      const hasPermissions = rule.permissions_required.every((perm) =>
        context.permissions.includes(perm)
      );

      if (!hasPermissions) {
        await this.auditService.logEvent({
          action: 'read',
          resource: 'user',
          resource_id: resourceType,
          success: false,
          error_message: 'Insufficient permissions',
          context: {
            user_id: context.user_id,
            company_id: context.company_id,
            ip_address: '',
          },
          details: {
            reason: 'Insufficient permissions',
            required: rule.permissions_required,
            actual: context.permissions,
          },
        });

        return {
          allowed: false,
          filters: [],
          reason: 'Insufficient permissions',
          audit_required: true,
        };
      }
    }

    // Build filters with context values
    const filters = rule.filters.map((filter) => ({
      ...filter,
      value: this.resolveFilterValue(filter, context),
    }));

    if (config.audit_access) {
      await this.auditService.logEvent({
        action: 'read',
        resource: 'user',
        resource_id: resourceType,
        success: true,
        context: {
          user_id: context.user_id,
          company_id: context.company_id,
          ip_address: '',
        },
        details: {
          operation,
          filters_applied: filters.length,
          role: context.role,
        },
      });
    }

    return {
      allowed: true,
      filters,
      audit_required: config.audit_access,
    };
  }

  private resolveFilterValue(
    filter: ScopeFilter,
    context: ScopeContext
  ): unknown {
    if (filter.value !== null) {
      return filter.value;
    }

    // Resolve context-based values
    switch (filter.field) {
      case 'company_id':
        return context.company_id;
      case 'department_id':
        return context.department_id;
      case 'user_id':
        return context.user_id;
      case 'assigned_to':
        return context.user_id;
      default:
        return filter.value;
    }
  }

  public buildMongoFilter(filters: ScopeFilter[]): Record<string, unknown> {
    const mongoFilter: Record<string, unknown> = {};

    for (const filter of filters) {
      if (!filter.required && !filter.value) {
        continue;
      }

      switch (filter.operator) {
        case 'equals':
          mongoFilter[filter.field] = filter.value;
          break;
        case 'not_equals':
          mongoFilter[filter.field] = { $ne: filter.value };
          break;
        case 'in':
          mongoFilter[filter.field] = {
            $in: Array.isArray(filter.value) ? filter.value : [filter.value],
          };
          break;
        case 'exists':
          mongoFilter[filter.field] = { $exists: true };
          break;
      }
    }

    return mongoFilter;
  }

  public async applyScopeToQuery(
    context: ScopeContext,
    resourceType: string,
    baseQuery: Record<string, unknown> = {},
    operation: 'read' | 'write' | 'delete' = 'read'
  ): Promise<{
    query: Record<string, unknown>;
    allowed: boolean;
    reason?: string;
  }> {
    const validation = await this.validateAccess(
      context,
      resourceType,
      operation
    );

    if (!validation.allowed) {
      return {
        query: {},
        allowed: false,
        reason: validation.reason,
      };
    }

    const scopeFilter = this.buildMongoFilter(validation.filters);
    const combinedQuery = { ...baseQuery, ...scopeFilter };

    return {
      query: combinedQuery,
      allowed: true,
    };
  }

  public registerScopeConfig(
    resourceType: string,
    config: DataScopeConfig
  ): void {
    this.scopeConfigs.set(resourceType, config);
  }

  public getScopeConfig(resourceType: string): DataScopeConfig | undefined {
    return this.scopeConfigs.get(resourceType);
  }

  public async testScopeEnforcement(
    context: ScopeContext,
    resourceType: string,
    testData: Record<string, unknown>[]
  ): Promise<{
    passed: boolean;
    accessible_records: number;
    total_records: number;
    violations: Record<string, unknown>[];
  }> {
    const validation = await this.validateAccess(context, resourceType);

    if (!validation.allowed) {
      return {
        passed: false,
        accessible_records: 0,
        total_records: testData.length,
        violations: testData.map((record) => ({
          record_id: record._id || record.id,
          reason: validation.reason,
        })),
      };
    }

    const scopeFilter = this.buildMongoFilter(validation.filters);
    const violations: Record<string, unknown>[] = [];
    let accessibleCount = 0;

    for (const record of testData) {
      let accessible = true;

      for (const [field, condition] of Object.entries(scopeFilter)) {
        const recordValue = record[field];

        if (typeof condition === 'object' && condition !== null) {
          const mongoCondition = condition as Record<string, unknown>;
          if (
            mongoCondition.$ne !== undefined &&
            recordValue === mongoCondition.$ne
          ) {
            accessible = false;
            break;
          }
          if (
            mongoCondition.$in !== undefined &&
            Array.isArray(mongoCondition.$in) &&
            !mongoCondition.$in.includes(recordValue)
          ) {
            accessible = false;
            break;
          }
          if (
            mongoCondition.$exists !== undefined &&
            mongoCondition.$exists &&
            recordValue === undefined
          ) {
            accessible = false;
            break;
          }
        } else if (recordValue !== condition) {
          accessible = false;
          break;
        }
      }

      if (accessible) {
        accessibleCount++;
      } else {
        violations.push({
          record_id: record._id || record.id,
          reason: 'Scope filter violation',
          failed_conditions: scopeFilter,
        });
      }
    }

    return {
      passed: violations.length === 0,
      accessible_records: accessibleCount,
      total_records: testData.length,
      violations,
    };
  }
}

// Middleware function for automatic scope application
export async function withDataScoping<T>(
  context: ScopeContext,
  resourceType: string,
  operation: 'read' | 'write' | 'delete',
  queryFn: (scopedQuery: Record<string, unknown>) => Promise<T>
): Promise<T> {
  const scopingService = DataScopingService.getInstance();

  const result = await scopingService.applyScopeToQuery(
    context,
    resourceType,
    {},
    operation
  );

  if (!result.allowed) {
    throw new Error(`Access denied: ${result.reason}`);
  }

  return await queryFn(result.query);
}

// Helper function to create scope context from user session
export function createScopeContext(
  user: Record<string, unknown>
): ScopeContext {
  return {
    user_id: (user._id || user.id) as string,
    role: user.role as UserRole,
    company_id: user.company_id as string,
    department_id: user.department_id as string,
    permissions: (user.permissions as string[]) || [],
  };
}

// Database query wrapper with automatic scoping
export class ScopedQuery {
  private context: ScopeContext;
  private scopingService: DataScopingService;

  constructor(context: ScopeContext) {
    this.context = context;
    this.scopingService = DataScopingService.getInstance();
  }

  async find(
    collection: string,
    resourceType: string,
    baseQuery: Record<string, unknown> = {},
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>[]> {
    await connectDB();

    const result = await this.scopingService.applyScopeToQuery(
      this.context,
      resourceType,
      baseQuery,
      'read'
    );

    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }

    const db = (global as any).mongoose.connection.db;
    return await db
      .collection(collection)
      .find(result.query, options)
      .toArray();
  }

  async findOne(
    collection: string,
    resourceType: string,
    baseQuery: Record<string, unknown> = {},
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown> | null> {
    await connectDB();

    const result = await this.scopingService.applyScopeToQuery(
      this.context,
      resourceType,
      baseQuery,
      'read'
    );

    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }

    const db = (global as any).mongoose.connection.db;
    return await db.collection(collection).findOne(result.query, options);
  }

  async updateMany(
    collection: string,
    resourceType: string,
    baseQuery: Record<string, unknown> = {},
    update: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    await connectDB();

    const result = await this.scopingService.applyScopeToQuery(
      this.context,
      resourceType,
      baseQuery,
      'write'
    );

    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }

    const db = (global as any).mongoose.connection.db;
    return await db
      .collection(collection)
      .updateMany(result.query, update, options);
  }

  async deleteMany(
    collection: string,
    resourceType: string,
    baseQuery: Record<string, unknown> = {},
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    await connectDB();

    const result = await this.scopingService.applyScopeToQuery(
      this.context,
      resourceType,
      baseQuery,
      'delete'
    );

    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }

    const db = (global as any).mongoose.connection.db;
    return await db.collection(collection).deleteMany(result.query, options);
  }

  async count(
    collection: string,
    resourceType: string,
    baseQuery: Record<string, unknown> = {}
  ): Promise<number> {
    await connectDB();

    const result = await this.scopingService.applyScopeToQuery(
      this.context,
      resourceType,
      baseQuery,
      'read'
    );

    if (!result.allowed) {
      return 0;
    }

    const db = (global as any).mongoose.connection.db;
    return await db.collection(collection).countDocuments(result.query);
  }
}

export default DataScopingService;


