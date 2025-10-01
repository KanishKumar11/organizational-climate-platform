/**
 * Application-wide constants
 */

// Industry options for company creation and management
export const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'energy_utilities', label: 'Energy & Utilities' },
  { value: 'transportation_logistics', label: 'Transportation & Logistics' },
  { value: 'construction', label: 'Construction' },
  { value: 'hospitality_tourism', label: 'Hospitality & Tourism' },
  { value: 'media_entertainment', label: 'Media & Entertainment' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'legal_services', label: 'Legal Services' },
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'agriculture_farming', label: 'Agriculture & Farming' },
  { value: 'other', label: 'Other' },
];

// Legacy string array for backward compatibility
export const INDUSTRY_OPTIONS = INDUSTRIES.map(industry => industry.label);

// Subscription tiers
export const SUBSCRIPTION_TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

// Company size options
export const COMPANY_SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-1000',
  '1000+',
];