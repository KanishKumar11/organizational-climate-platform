import QuestionBank, { IQuestionBankItem } from '@/models/QuestionBank';
import { connectDB } from '@/lib/mongodb';
import type { FilterQuery } from 'mongoose';

/**
 * CLIMA-002: Question Library Service
 *
 * Provides search, filtering, and management of reusable questions
 * with bilingual support, categories, tags, and duplicate prevention.
 */

export interface QuestionSearchFilters {
  category_id?: string;
  tags?: string[];
  type?: string;
  difficulty_level?: string;
  language?: 'en' | 'es';
  search_query?: string;
  company_id?: string;
  include_global?: boolean;
  is_approved_only?: boolean;
}

export interface QuestionSearchResult {
  questions: IQuestionBankItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export class QuestionLibraryService {
  /**
   * Search questions with filters and pagination
   */
  static async searchQuestions(
    filters: QuestionSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<QuestionSearchResult> {
    await connectDB();

    const query: FilterQuery<IQuestionBankItem> = {
      is_active: true,
    };

    // Category filter
    if (filters.category_id) {
      query.category = filters.category_id;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    // Question type filter
    if (filters.type) {
      query.type = filters.type;
    }

    // Company scope - QuestionBank uses company_id field
    if (filters.company_id) {
      if (filters.include_global) {
        query.$or = [{ company_id: filters.company_id }, { company_id: null }];
      } else {
        query.company_id = filters.company_id;
      }
    } else if (filters.include_global) {
      query.company_id = null; // Global questions
    }

    // Text search
    if (filters.search_query && filters.search_query.trim()) {
      const searchRegex = new RegExp(filters.search_query.trim(), 'i');
      query.$or = [
        { text: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Count total matching questions
    const total = await QuestionBank.countDocuments(query).exec();

    // Fetch paginated results
    const skip = (page - 1) * limit;
    const questions = await (QuestionBank as any)
      .find(query)
      .sort({ 'metrics.usage_count': -1, updated_at: -1 }) // Most used first
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return {
      questions: questions as IQuestionBankItem[],
      total,
      page,
      limit,
      has_more: skip + questions.length < total,
    };
  }

  /**
   * Get all categories from QuestionBank
   */
  static async getCategories(
    companyId?: string,
    includeGlobal: boolean = true
  ) {
    await connectDB();

    const query: any = { is_active: true };

    if (companyId) {
      if (includeGlobal) {
        query.$or = [
          { company_id: companyId },
          { company_id: null }, // Global categories
        ];
      } else {
        query.company_id = companyId;
      }
    } else if (includeGlobal) {
      query.company_id = null;
    }

    // Get distinct categories from QuestionBank
    const categories = await QuestionBank.distinct('category', query);

    // Return categories in a simple format
    return categories.map((cat: string) => ({
      _id: cat,
      name: cat,
      is_active: true,
    }));
  }

  /**
   * Add question from library to survey (increments usage count)
   */
  static async useQuestion(questionId: string): Promise<void> {
    await connectDB();

    await QuestionBank.findByIdAndUpdate(questionId, {
      $inc: { 'metrics.usage_count': 1 },
      'metrics.last_used': new Date(),
    }).exec();
  }

  /**
   * Get popular questions (most used)
   */
  static async getPopularQuestions(
    companyId?: string,
    limit: number = 10
  ): Promise<IQuestionBankItem[]> {
    await connectDB();

    const query: any = {
      is_active: true,
    };

    if (companyId) {
      query.$or = [{ company_id: companyId }, { company_id: null }];
    } else {
      query.company_id = null; // Global only
    }

    return (await QuestionBank.find(query)
      .sort({ 'metrics.usage_count': -1, 'metrics.last_used': -1 })
      .limit(limit)
      .lean()
      .exec()) as IQuestionBankItem[];
  }

  /**
   * Get questions by category
   */
  static async getQuestionsByCategory(
    category: string,
    companyId?: string,
    includeGlobal: boolean = true
  ): Promise<IQuestionBankItem[]> {
    await connectDB();

    const query: any = {
      category,
      is_active: true,
    };

    if (companyId) {
      if (includeGlobal) {
        query.$or = [{ company_id: companyId }, { company_id: null }];
      } else {
        query.company_id = companyId;
      }
    } else if (includeGlobal) {
      query.company_id = null;
    }

    return (await QuestionBank.find(query)
      .sort({ 'metrics.usage_count': -1, text: 1 })
      .lean()
      .exec()) as IQuestionBankItem[];
  }
}

export default QuestionLibraryService;
