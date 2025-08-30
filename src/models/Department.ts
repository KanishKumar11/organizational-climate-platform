import mongoose, { Document, Schema } from 'mongoose';

// Department hierarchy interface
export interface DepartmentHierarchy {
  parent_department_id?: string;
  level: number;
  path: string; // e.g., "engineering/backend/api"
}

// Department settings interface
export interface DepartmentSettings {
  survey_participation_required: boolean;
  microclimate_frequency: 'weekly' | 'bi_weekly' | 'monthly';
  auto_action_plans: boolean;
  notification_preferences: {
    email_enabled: boolean;
    slack_enabled: boolean;
    teams_enabled: boolean;
  };
}

// Main Department interface
export interface IDepartment extends Document {
  name: string;
  description?: string;
  company_id: string;
  hierarchy: DepartmentHierarchy;
  manager_id?: string;
  settings: DepartmentSettings;
  employee_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;

  // Virtual methods
  getFullPath(): string;
  getSubDepartments(): Promise<IDepartment[]>;
  getParentDepartment(): Promise<IDepartment | null>;
}

// Department hierarchy schema
const DepartmentHierarchySchema = new Schema(
  {
    parent_department_id: { type: String },
    level: { type: Number, default: 0 },
    path: { type: String, required: true },
  },
  { _id: false }
);

// Department settings schema
const DepartmentSettingsSchema = new Schema(
  {
    survey_participation_required: { type: Boolean, default: true },
    microclimate_frequency: {
      type: String,
      enum: ['weekly', 'bi_weekly', 'monthly'],
      default: 'monthly',
    },
    auto_action_plans: { type: Boolean, default: true },
    notification_preferences: {
      email_enabled: { type: Boolean, default: true },
      slack_enabled: { type: Boolean, default: false },
      teams_enabled: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

// Main Department schema
const DepartmentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    hierarchy: {
      type: DepartmentHierarchySchema,
      required: true,
    },
    manager_id: {
      type: String,
      trim: true,
    },
    settings: {
      type: DepartmentSettingsSchema,
      default: () => ({}),
    },
    employee_count: {
      type: Number,
      default: 0,
      min: [0, 'Employee count cannot be negative'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
DepartmentSchema.index({ company_id: 1, is_active: 1 });
DepartmentSchema.index({ 'hierarchy.parent_department_id': 1 });
DepartmentSchema.index({ 'hierarchy.level': 1 });
DepartmentSchema.index({ manager_id: 1 });
DepartmentSchema.index({ company_id: 1, name: 1 }, { unique: true });

// Instance methods
DepartmentSchema.methods.getFullPath = function (): string {
  return this.hierarchy.path;
};

DepartmentSchema.methods.getSubDepartments = function (): Promise<
  IDepartment[]
> {
  return this.constructor.find({
    'hierarchy.parent_department_id': this._id.toString(),
    is_active: true,
  });
};

DepartmentSchema.methods.getParentDepartment =
  function (): Promise<IDepartment | null> {
    if (!this.hierarchy.parent_department_id) {
      return Promise.resolve(null);
    }
    return this.constructor.findById(this.hierarchy.parent_department_id);
  };

// Static methods
DepartmentSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId, is_active: true });
};

DepartmentSchema.statics.findRootDepartments = function (companyId: string) {
  return this.find({
    company_id: companyId,
    'hierarchy.level': 0,
    is_active: true,
  });
};

DepartmentSchema.statics.findByManager = function (managerId: string) {
  return this.find({ manager_id: managerId, is_active: true });
};

DepartmentSchema.statics.findByLevel = function (
  companyId: string,
  level: number
) {
  return this.find({
    company_id: companyId,
    'hierarchy.level': level,
    is_active: true,
  });
};

// Pre-save middleware to update hierarchy path
DepartmentSchema.pre('save', async function (next) {
  if (this.isModified('hierarchy.parent_department_id') || this.isNew) {
    const doc = this as unknown as IDepartment;
    if (doc.hierarchy.parent_department_id) {
      const parent = await (
        this.constructor as mongoose.Model<IDepartment>
      ).findById(doc.hierarchy.parent_department_id);
      if (parent) {
        doc.hierarchy.level = parent.hierarchy.level + 1;
        doc.hierarchy.path = `${parent.hierarchy.path}/${doc.name.toLowerCase().replace(/\s+/g, '-')}`;
      }
    } else {
      doc.hierarchy.level = 0;
      doc.hierarchy.path = doc.name.toLowerCase().replace(/\s+/g, '-');
    }
  }
  next();
});

const Department = (mongoose.models.Department ||
  mongoose.model<IDepartment>(
    'Department',
    DepartmentSchema
  )) as mongoose.Model<IDepartment>;

export default Department;
export { Department };
