import LibraryQuestion, { ILibraryQuestion } from '@/models/LibraryQuestion';
import QuestionCategory from '@/models/QuestionCategory';
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
  questions: ILibraryQuestion[];
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

    const query: FilterQuery<ILibraryQuestion> = {
      is_active: true,
      is_latest: true,
    };

    // Category filter
    if (filters.category_id) {
      query.category_id = filters.category_id;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    // Question type filter
    if (filters.type) {
      query.type = filters.type;
    }

    // Difficulty level
    if (filters.difficulty_level) {
      query.difficulty_level = filters.difficulty_level;
    }

    // Company scope
    if (filters.company_id) {
      if (filters.include_global) {
        query.$or = [{ company_id: filters.company_id }, { is_global: true }];
      } else {
        query.company_id = filters.company_id;
      }
    } else if (filters.include_global) {
      query.is_global = true;
    }

    // Approval filter
    if (filters.is_approved_only) {
      query.is_approved = true;
    }

    // Text search (bilingual)
    if (filters.search_query && filters.search_query.trim()) {
      const searchRegex = new RegExp(filters.search_query.trim(), 'i');
      query.$or = [
        { 'text.en': searchRegex },
        { 'text.es': searchRegex },
        { 'keywords.en': searchRegex },
        { 'keywords.es': searchRegex },
        { tags: searchRegex },
      ];
    }

    // Count total matching questions
    const total = await LibraryQuestion.countDocuments(query).exec();

    // Fetch paginated results
    const skip = (page - 1) * limit;
    const questions = await (LibraryQuestion as any)
      .find(query)
      .populate('category_id', 'name description')
      .sort({ usage_count: -1, updated_at: -1 }) // Most used first
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return {
      questions: questions as ILibraryQuestion[],
      total,
      page,
      limit,
      has_more: skip + questions.length < total,
    };
  }

  /**
   * Get all categories (hierarchical)
   */
  static async getCategories(
    companyId?: string,
    includeGlobal: boolean = true
  ) {
    await connectDB();

    const query: FilterQuery<any> = { is_active: true };

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

    const categories = await (QuestionCategory as any)
      .find(query)
      .sort({ order: 1, 'name.en': 1 })
      .lean()
      .exec();

    // Build hierarchical structure
    return this.buildCategoryTree(categories);
  }

  /**
   * Build hierarchical category tree
   */
  private static buildCategoryTree(categories: any[]): any[] {
    const categoryMap = new Map();
    const roots: any[] = [];

    // Create map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), { ...cat, children: [] });
    });

    // Build tree structure
    categories.forEach((cat) => {
      const category = categoryMap.get(cat._id.toString());
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id.toString());
        if (parent) {
          parent.children.push(category);
        } else {
          roots.push(category);
        }
      } else {
        roots.push(category);
      }
    });

    return roots;
  }

  /**
   * Check for duplicate questions (same text in same category)
   */
  static async checkDuplicate(
    text_en: string,
    text_es: string,
    category_id: string,
    company_id?: string
  ): Promise<{ is_duplicate: boolean; existing_question?: ILibraryQuestion }> {
    await connectDB();

    const query: FilterQuery<ILibraryQuestion> = {
      category_id,
      is_active: true,
      is_latest: true,
      $or: [
        { 'text.en': { $regex: new RegExp(`^${text_en}$`, 'i') } },
        { 'text.es': { $regex: new RegExp(`^${text_es}$`, 'i') } },
      ],
    } as FilterQuery<ILibraryQuestion>;

    if (company_id) {
      query.company_id = company_id;
    }

    const existing = await (LibraryQuestion as any).findOne(query).exec();

    return {
      is_duplicate: !!existing,
      existing_question: existing as ILibraryQuestion | undefined,
    };
  }

  /**
   * Add question from library to survey (increments usage count)
   */
  static async useQuestion(questionId: string): Promise<void> {
    await connectDB();

    await (LibraryQuestion as any)
      .findByIdAndUpdate(questionId, {
        $inc: { usage_count: 1 },
        last_used_at: new Date(),
      })
      .exec();
  }

  /**
   * Get popular questions (most used)
   */
  static async getPopularQuestions(
    companyId?: string,
    limit: number = 10
  ): Promise<ILibraryQuestion[]> {
    await connectDB();

    const query: FilterQuery<ILibraryQuestion> = {
      is_active: true,
      is_latest: true,
      is_approved: true,
    };

    if (companyId) {
      query.$or = [{ company_id: companyId }, { is_global: true }];
    } else {
      query.is_global = true;
    }

    return (await (LibraryQuestion as any)
      .find(query)
      .sort({ usage_count: -1, last_used_at: -1 })
      .limit(limit)
      .lean()
      .exec()) as ILibraryQuestion[];
  }

  /**
   * Get questions by category
   */
  static async getQuestionsByCategory(
    categoryId: string,
    companyId?: string,
    includeGlobal: boolean = true
  ): Promise<ILibraryQuestion[]> {
    await connectDB();

    const query: FilterQuery<ILibraryQuestion> = {
      category_id: categoryId,
      is_active: true,
      is_latest: true,
    };

    if (companyId) {
      if (includeGlobal) {
        query.$or = [{ company_id: companyId }, { is_global: true }];
      } else {
        query.company_id = companyId;
      }
    } else if (includeGlobal) {
      query.is_global = true;
    }

    return (await (LibraryQuestion as any)
      .find(query)
      .sort({ order: 1, 'text.en': 1 })
      .lean()
      .exec()) as ILibraryQuestion[];
  }

  /**
   * Create new version of a question
   */
  static async createVersion(
    questionId: string,
    updates: Partial<ILibraryQuestion>,
    userId: string
  ): Promise<ILibraryQuestion> {
    await connectDB();

    const original = await (LibraryQuestion as any).findById(questionId).exec();
    if (!original) {
      throw new Error('Original question not found');
    }

    // Mark original as not latest
    original.is_latest = false;
    await original.save();

    // Create new version
    const newVersion = new LibraryQuestion({
      ...original.toObject(),
      _id: undefined,
      ...updates,
      version: original.version + 1,
      previous_version_id: original._id.toString(),
      is_latest: true,
      created_by: userId,
      is_approved: false, // Requires re-approval
    });

    await newVersion.save();
    return newVersion;
  }
}

export default QuestionLibraryService;
