import mongoose, { Schema, Document } from 'mongoose';

/**
 * CLIMA-002: Question Library - Category Model
 * Hierarchical categories for organizing questions in the library
 */

export interface IQuestionCategory extends Document {
  _id: string;
  name: {
    en: string;
    es: string;
  };
  description?: {
    en: string;
    es: string;
  };
  parent_id?: mongoose.Types.ObjectId; // For hierarchical structure
  level: number; // 0-5 depth level
  path: string; // Dot-notation path for queries (e.g., "root.parent.child")
  order: number;
  icon?: string; // Icon identifier for UI
  color?: string; // Hex color for visual distinction
  
  // Denormalized counts for performance
  question_count: number;
  subcategory_count: number;
  
  // Scope
  is_active: boolean;
  is_global: boolean; // True for system-wide categories
  company_id?: mongoose.Types.ObjectId; // null for global categories
  
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  
  // Methods
  getTree(): Promise<any>;
  getBreadcrumb(): Promise<IQuestionCategory[]>;
  updateCounts(): Promise<void>;
}

const QuestionCategorySchema = new Schema<IQuestionCategory>(
  {
    name: {
      en: { type: String, required: true, trim: true, maxlength: 100 },
      es: { type: String, required: true, trim: true, maxlength: 100 },
    },
    description: {
      en: { type: String, trim: true, maxlength: 500 },
      es: { type: String, trim: true, maxlength: 500 },
    },
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionCategory',
      default: null,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    path: {
      type: String,
      default: '',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: 'folder',
    },
    color: {
      type: String,
      match: /^#[0-9A-F]{6}$/i,
      default: '#6B7280',
    },
    question_count: {
      type: Number,
      default: 0,
    },
    subcategory_count: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_global: {
      type: Boolean,
      default: false,
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null, // null = global/system category
    },
    created_by: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for performance
QuestionCategorySchema.index({ company_id: 1, is_active: 1 });
QuestionCategorySchema.index({ parent_id: 1, order: 1 });
QuestionCategorySchema.index({ path: 1 });
QuestionCategorySchema.index({ is_global: 1, is_active: 1 });
QuestionCategorySchema.index({ 'name.en': 'text', 'name.es': 'text' });

// Pre-save hook to calculate level and path
QuestionCategorySchema.pre('save', async function(next) {
  if (this.isModified('parent_id') || this.isNew) {
    if (!this.parent_id) {
      this.level = 0;
      this.path = this._id.toString();
    } else {
      const parent = await mongoose.model('QuestionCategory').findById(this.parent_id);
      if (parent) {
        this.level = parent.level + 1;
        this.path = `${parent.path}.${this._id}`;
      }
    }
  }
  next();
});

// Get full category tree
QuestionCategorySchema.methods.getTree = async function(): Promise<any> {
  const Category = mongoose.model<IQuestionCategory>('QuestionCategory');
  
  // Get all subcategories
  const subcategories = await Category.find({
    path: new RegExp(`^${this.path}`),
    is_active: true,
  }).sort({ level: 1, order: 1 });
  
  // Build tree structure
  const buildTree = (parentPath: string, items: IQuestionCategory[]) => {
    return items
      .filter(item => {
        const itemParentPath = item.path.split('.').slice(0, -1).join('.');
        return itemParentPath === parentPath;
      })
      .map(item => ({
        ...item.toObject(),
        children: buildTree(item.path, items),
      }));
  };
  
  return {
    ...this.toObject(),
    children: buildTree(this.path, subcategories),
  };
};

// Get breadcrumb path to root
QuestionCategorySchema.methods.getBreadcrumb = async function(): Promise<IQuestionCategory[]> {
  const Category = mongoose.model<IQuestionCategory>('QuestionCategory');
  const pathIds = this.path.split('.');
  
  const categories = await Category.find({
    _id: { $in: pathIds },
  }).sort({ level: 1 });
  
  return categories;
};

// Update denormalized counts
QuestionCategorySchema.methods.updateCounts = async function(): Promise<void> {
  const QuestionLibrary = mongoose.model('QuestionLibrary');
  const Category = mongoose.model<IQuestionCategory>('QuestionCategory');
  
  // Count questions
  this.question_count = await QuestionLibrary.countDocuments({
    category_id: this._id,
    is_active: true,
  });
  
  // Count subcategories
  this.subcategory_count = await Category.countDocuments({
    parent_id: this._id,
    is_active: true,
  });
  
  await this.save();
};

// Static method to rebuild all paths (for maintenance)
QuestionCategorySchema.statics.rebuildPaths = async function(): Promise<void> {
  const categories = await this.find().sort({ level: 1 });
  
  for (const category of categories) {
    if (!category.parent_id) {
      category.level = 0;
      category.path = category._id.toString();
    } else {
      const parent = categories.find(c => c._id.toString() === category.parent_id.toString());
      if (parent) {
        category.level = parent.level + 1;
        category.path = `${parent.path}.${category._id}`;
      }
    }
    await category.save();
  }
};

export default mongoose.models.QuestionCategory ||
  mongoose.model<IQuestionCategory>('QuestionCategory', QuestionCategorySchema);
