/**
 * Database Optimization Service
 * Handles database indexing, query optimization, and connection management
 */

import mongoose from 'mongoose';
import AuditService from './audit-service';

export interface IndexDefinition {
  collection: string;
  fields: Record<string, 1 | -1 | 'text' | '2dsphere'>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
    name?: string;
    partialFilterExpression?: any;
    expireAfterSeconds?: number;
  };
}

export interface QueryAnalysis {
  collection: string;
  query: any;
  execution_time_ms: number;
  documents_examined: number;
  documents_returned: number;
  index_used: string | null;
  stage: string;
  optimization_suggestions: string[];
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private auditService: AuditService;
  private queryAnalytics: Map<string, QueryAnalysis[]> = new Map();

  private constructor() {
    this.auditService = AuditService.getInstance();
  }

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  public async createOptimalIndexes(): Promise<void> {
    console.log('Creating optimal database indexes...');

    const indexes: IndexDefinition[] = [
      // User collection indexes
      {
        collection: 'users',
        fields: { email: 1 },
        options: { unique: true, name: 'email_unique' },
      },
      {
        collection: 'users',
        fields: { company_id: 1, role: 1 },
        options: { name: 'company_role_idx' },
      },
      {
        collection: 'users',
        fields: { department_id: 1, is_active: 1 },
        options: { name: 'department_active_idx' },
      },
      {
        collection: 'users',
        fields: { created_at: -1 },
        options: { name: 'created_at_desc_idx' },
      },

      // Survey collection indexes
      {
        collection: 'surveys',
        fields: { company_id: 1, status: 1 },
        options: { name: 'company_status_idx' },
      },
      {
        collection: 'surveys',
        fields: { created_by: 1, created_at: -1 },
        options: { name: 'creator_date_idx' },
      },
      {
        collection: 'surveys',
        fields: { start_date: 1, end_date: 1 },
        options: { name: 'date_range_idx' },
      },
      {
        collection: 'surveys',
        fields: { type: 1, company_id: 1 },
        options: { name: 'type_company_idx' },
      },
      {
        collection: 'surveys',
        fields: { title: 'text', description: 'text' },
        options: { name: 'survey_text_search' },
      },

      // Response collection indexes
      {
        collection: 'responses',
        fields: { survey_id: 1, user_id: 1 },
        options: { name: 'survey_user_idx' },
      },
      {
        collection: 'responses',
        fields: { survey_id: 1, question_id: 1 },
        options: { name: 'survey_question_idx' },
      },
      {
        collection: 'responses',
        fields: { user_id: 1, created_at: -1 },
        options: { name: 'user_date_idx' },
      },
      {
        collection: 'responses',
        fields: { survey_id: 1, created_at: -1 },
        options: { name: 'survey_date_idx' },
      },
      {
        collection: 'responses',
        fields: { company_id: 1, department_id: 1 },
        options: { name: 'company_department_idx' },
      },

      // Microclimate collection indexes
      {
        collection: 'microclimates',
        fields: { company_id: 1, status: 1 },
        options: { name: 'microclimate_company_status_idx' },
      },
      {
        collection: 'microclimates',
        fields: { department_id: 1, created_at: -1 },
        options: { name: 'microclimate_department_date_idx' },
      },
      {
        collection: 'microclimates',
        fields: { created_by: 1, status: 1 },
        options: { name: 'microclimate_creator_status_idx' },
      },
      {
        collection: 'microclimates',
        fields: { start_time: 1, end_time: 1 },
        options: { name: 'microclimate_time_range_idx' },
      },

      // Action Plan collection indexes
      {
        collection: 'actionplans',
        fields: { company_id: 1, status: 1 },
        options: { name: 'actionplan_company_status_idx' },
      },
      {
        collection: 'actionplans',
        fields: { assigned_to: 1, due_date: 1 },
        options: { name: 'actionplan_assigned_due_idx' },
      },
      {
        collection: 'actionplans',
        fields: { created_by: 1, created_at: -1 },
        options: { name: 'actionplan_creator_date_idx' },
      },
      {
        collection: 'actionplans',
        fields: { department_id: 1, priority: 1 },
        options: { name: 'actionplan_department_priority_idx' },
      },
      {
        collection: 'actionplans',
        fields: { due_date: 1 },
        options: {
          name: 'actionplan_due_date_idx',
          partialFilterExpression: {
            status: { $in: ['not_started', 'in_progress'] },
          },
        },
      },

      // AI Insights collection indexes
      {
        collection: 'aiinsights',
        fields: { survey_id: 1, type: 1 },
        options: { name: 'insight_survey_type_idx' },
      },
      {
        collection: 'aiinsights',
        fields: { company_id: 1, priority: 1 },
        options: { name: 'insight_company_priority_idx' },
      },
      {
        collection: 'aiinsights',
        fields: { created_at: -1 },
        options: { name: 'insight_date_desc_idx' },
      },
      {
        collection: 'aiinsights',
        fields: { category: 1, confidence_score: -1 },
        options: { name: 'insight_category_confidence_idx' },
      },

      // Report collection indexes
      {
        collection: 'reports',
        fields: { company_id: 1, created_at: -1 },
        options: { name: 'report_company_date_idx' },
      },
      {
        collection: 'reports',
        fields: { created_by: 1, status: 1 },
        options: { name: 'report_creator_status_idx' },
      },
      {
        collection: 'reports',
        fields: { type: 1, company_id: 1 },
        options: { name: 'report_type_company_idx' },
      },

      // Benchmark collection indexes
      {
        collection: 'benchmarks',
        fields: { type: 1, is_active: 1 },
        options: { name: 'benchmark_type_active_idx' },
      },
      {
        collection: 'benchmarks',
        fields: { company_id: 1, category: 1 },
        options: { name: 'benchmark_company_category_idx' },
      },

      // Question collection indexes
      {
        collection: 'questions',
        fields: { category: 1, is_active: 1 },
        options: { name: 'question_category_active_idx' },
      },
      {
        collection: 'questions',
        fields: { effectiveness_score: -1 },
        options: { name: 'question_effectiveness_idx' },
      },
      {
        collection: 'questions',
        fields: { text: 'text' },
        options: { name: 'question_text_search' },
      },

      // Audit Log collection indexes
      {
        collection: 'auditlogs',
        fields: { user_id: 1, timestamp: -1 },
        options: { name: 'audit_user_time_idx' },
      },
      {
        collection: 'auditlogs',
        fields: { company_id: 1, action: 1 },
        options: { name: 'audit_company_action_idx' },
      },
      {
        collection: 'auditlogs',
        fields: { resource: 1, resource_id: 1 },
        options: { name: 'audit_resource_idx' },
      },
      {
        collection: 'auditlogs',
        fields: { timestamp: -1 },
        options: {
          name: 'audit_timestamp_ttl_idx',
          expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        },
      },

      // Compound indexes for common query patterns
      {
        collection: 'responses',
        fields: { company_id: 1, survey_id: 1, created_at: -1 },
        options: { name: 'response_company_survey_date_idx' },
      },
      {
        collection: 'surveys',
        fields: { company_id: 1, status: 1, created_at: -1 },
        options: { name: 'survey_company_status_date_idx' },
      },
      {
        collection: 'users',
        fields: { company_id: 1, department_id: 1, role: 1 },
        options: { name: 'user_company_dept_role_idx' },
      },
    ];

    // Create indexes
    for (const indexDef of indexes) {
      try {
        await this.createIndex(indexDef);
      } catch (error) {
        console.error(
          `Failed to create index for ${indexDef.collection}:`,
          error
        );
      }
    }

    console.log('Database index optimization completed');
  }

  private async createIndex(indexDef: IndexDefinition): Promise<void> {
    try {
      const collection = mongoose.connection.db.collection(indexDef.collection);

      // Check if index already exists
      const existingIndexes = await collection.indexes();
      const indexName =
        indexDef.options?.name || this.generateIndexName(indexDef.fields);

      const indexExists = existingIndexes.some((idx) => idx.name === indexName);

      if (!indexExists) {
        await collection.createIndex(indexDef.fields, indexDef.options);
        console.log(`Created index: ${indexName} on ${indexDef.collection}`);
      } else {
        console.log(
          `Index already exists: ${indexName} on ${indexDef.collection}`
        );
      }
    } catch (error) {
      console.error(`Error creating index on ${indexDef.collection}:`, error);
      throw error;
    }
  }

  private generateIndexName(fields: Record<string, any>): string {
    return Object.keys(fields).join('_') + '_idx';
  }

  public async analyzeQuery(
    collection: string,
    query: any,
    options?: any
  ): Promise<QueryAnalysis> {
    const startTime = Date.now();

    try {
      // Execute explain on the query
      const db = mongoose.connection.db;
      const coll = db.collection(collection);

      const explainResult = await coll
        .find(query, options)
        .explain('executionStats');
      const executionTime = Date.now() - startTime;

      const executionStats = explainResult.executionStats;
      const winningPlan = explainResult.queryPlanner.winningPlan;

      const analysis: QueryAnalysis = {
        collection,
        query,
        execution_time_ms: executionTime,
        documents_examined: executionStats.totalDocsExamined || 0,
        documents_returned: executionStats.totalDocsReturned || 0,
        index_used: this.extractIndexUsed(winningPlan),
        stage: winningPlan.stage,
        optimization_suggestions:
          this.generateOptimizationSuggestions(explainResult),
      };

      // Store analysis for later review
      if (!this.queryAnalytics.has(collection)) {
        this.queryAnalytics.set(collection, []);
      }
      this.queryAnalytics.get(collection)!.push(analysis);

      // Log slow queries
      if (executionTime > 1000) {
        await this.auditService.logEvent({
          action: 'read',
          resource: 'audit_log',
          resource_id: collection,
          success: true,
          context: {
            user_id: 'system',
            company_id: 'system',
            ip_address: '',
          },
          details: {
            execution_time_ms: executionTime,
            documents_examined: analysis.documents_examined,
            documents_returned: analysis.documents_returned,
            query: JSON.stringify(query),
            suggestions: analysis.optimization_suggestions,
          },
        });
      }

      return analysis;
    } catch (error) {
      console.error('Query analysis failed:', error);
      throw error;
    }
  }

  private extractIndexUsed(winningPlan: any): string | null {
    if (winningPlan.inputStage && winningPlan.inputStage.indexName) {
      return winningPlan.inputStage.indexName;
    }

    if (winningPlan.stage === 'IXSCAN' && winningPlan.indexName) {
      return winningPlan.indexName;
    }

    return null;
  }

  private generateOptimizationSuggestions(explainResult: any): string[] {
    const suggestions: string[] = [];
    const executionStats = explainResult.executionStats;
    const winningPlan = explainResult.queryPlanner.winningPlan;

    // Check for collection scans
    if (winningPlan.stage === 'COLLSCAN') {
      suggestions.push(
        'Query is performing a collection scan. Consider adding an index.'
      );
    }

    // Check for high document examination ratio
    const examineRatio =
      executionStats.totalDocsExamined /
      Math.max(executionStats.totalDocsReturned, 1);
    if (examineRatio > 10) {
      suggestions.push(
        `Query examines ${examineRatio.toFixed(1)}x more documents than returned. Consider optimizing the query or adding a more selective index.`
      );
    }

    // Check for rejected plans
    if (
      explainResult.queryPlanner.rejectedPlans &&
      explainResult.queryPlanner.rejectedPlans.length > 0
    ) {
      suggestions.push(
        'Multiple query plans were considered. The current index might not be optimal.'
      );
    }

    // Check execution time
    if (executionStats.executionTimeMillis > 100) {
      suggestions.push(
        'Query execution time is high. Consider adding compound indexes for frequently used query patterns.'
      );
    }

    // Check for sorts without indexes
    if (
      winningPlan.stage === 'SORT' ||
      (winningPlan.inputStage && winningPlan.inputStage.stage === 'SORT')
    ) {
      suggestions.push(
        'Query includes sorting that may not use an index. Consider adding an index that supports the sort order.'
      );
    }

    return suggestions;
  }

  public async getQueryAnalytics(
    collection?: string
  ): Promise<QueryAnalysis[]> {
    if (collection) {
      return this.queryAnalytics.get(collection) || [];
    }

    const allAnalytics: QueryAnalysis[] = [];
    for (const analytics of this.queryAnalytics.values()) {
      allAnalytics.push(...analytics);
    }

    return allAnalytics;
  }

  public async optimizeConnectionPool(): Promise<void> {
    const optimizedOptions = {
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2, // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    console.log('Recommended optimized options:', optimizedOptions);

    // Note: Connection pool optimization would typically require reconnection
    // This is more of a configuration recommendation
  }

  public async getIndexUsageStats(): Promise<Record<string, any>> {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const stats: Record<string, any> = {};

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);

      try {
        const indexStats = await collection
          .aggregate([{ $indexStats: {} }])
          .toArray();

        stats[collName] = indexStats.map((stat) => ({
          name: stat.name,
          accesses: stat.accesses,
          usage_count: stat.accesses?.ops || 0,
          since: stat.accesses?.since,
        }));
      } catch (error) {
        // Some collections might not support $indexStats
        stats[collName] = { error: 'Index stats not available' };
      }
    }

    return stats;
  }

  public async suggestNewIndexes(): Promise<IndexDefinition[]> {
    const suggestions: IndexDefinition[] = [];
    const analytics = await this.getQueryAnalytics();

    // Analyze slow queries and suggest indexes
    const slowQueries = analytics.filter((a) => a.execution_time_ms > 1000);

    for (const query of slowQueries) {
      if (query.stage === 'COLLSCAN') {
        // Suggest index based on query fields
        const queryFields = Object.keys(query.query);
        if (queryFields.length > 0) {
          const indexFields: Record<string, 1> = {};
          queryFields.forEach((field) => {
            indexFields[field] = 1;
          });

          suggestions.push({
            collection: query.collection,
            fields: indexFields,
            options: {
              name: `suggested_${queryFields.join('_')}_idx`,
              background: true,
            },
          });
        }
      }
    }

    return suggestions;
  }

  public async cleanupUnusedIndexes(): Promise<string[]> {
    const indexStats = await this.getIndexUsageStats();
    const droppedIndexes: string[] = [];

    for (const [collectionName, stats] of Object.entries(indexStats)) {
      if (Array.isArray(stats)) {
        const unusedIndexes = stats.filter(
          (stat) =>
            stat.usage_count === 0 &&
            stat.name !== '_id_' && // Never drop the _id index
            !stat.name.includes('unique') // Be careful with unique indexes
        );

        for (const unusedIndex of unusedIndexes) {
          try {
            const collection =
              mongoose.connection.db.collection(collectionName);
            await collection.dropIndex(unusedIndex.name);
            droppedIndexes.push(`${collectionName}.${unusedIndex.name}`);
            console.log(
              `Dropped unused index: ${collectionName}.${unusedIndex.name}`
            );
          } catch (error) {
            console.error(`Failed to drop index ${unusedIndex.name}:`, error);
          }
        }
      }
    }

    return droppedIndexes;
  }

  public async getDatabaseStats(): Promise<any> {
    const db = mongoose.connection.db;
    const stats = await db.stats();

    return {
      database_size_mb: Math.round(stats.dataSize / (1024 * 1024)),
      index_size_mb: Math.round(stats.indexSize / (1024 * 1024)),
      collections: stats.collections,
      indexes: stats.indexes,
      average_object_size: Math.round(stats.avgObjSize),
      storage_size_mb: Math.round(stats.storageSize / (1024 * 1024)),
    };
  }
}

export default DatabaseOptimizer;
