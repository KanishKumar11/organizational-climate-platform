import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Microclimate template structure
export interface MicroclimateTemplate {
  _id: string;
  name: string;
  description: string;
  category:
    | 'engagement'
    | 'wellbeing'
    | 'leadership'
    | 'teamwork'
    | 'communication'
    | 'custom';
  tags: string[];
  questions: Array<{
    text_es: string;
    text_en: string;
    type: 'likert' | 'emoji_rating' | 'multiple_choice' | 'open_ended';
    options_es?: string[];
    options_en?: string[];
    category: string;
    required?: boolean;
  }>;
  estimated_duration: number;
  target_audience: string;
  created_by?: string;
  is_default: boolean;
  usage_count?: number;
  created_at: string;
}

// Default templates (seed data)
const DEFAULT_TEMPLATES: MicroclimateTemplate[] = [
  {
    _id: 'template-engagement-pulse',
    name: 'Quick Engagement Pulse',
    description: 'Fast 5-question pulse check for team engagement and morale',
    category: 'engagement',
    tags: ['quick', 'engagement', 'morale', 'pulse'],
    estimated_duration: 3,
    target_audience: 'All employees',
    is_default: true,
    usage_count: 245,
    created_at: '2025-01-15T10:00:00Z',
    questions: [
      {
        text_es: '¿Qué tan satisfecho estás con tu trabajo actual?',
        text_en: 'How satisfied are you with your current work?',
        type: 'emoji_rating',
        category: 'Satisfaction',
        required: true,
      },
      {
        text_es: '¿Sientes que tu trabajo es valorado por tu equipo?',
        text_en: 'Do you feel your work is valued by your team?',
        type: 'likert',
        category: 'Recognition',
        required: true,
      },
      {
        text_es: '¿Qué tan claro tienes tus objetivos y responsabilidades?',
        text_en: 'How clear are your goals and responsibilities?',
        type: 'likert',
        category: 'Clarity',
        required: true,
      },
      {
        text_es: '¿Recomendarías trabajar aquí a un amigo?',
        text_en: 'Would you recommend working here to a friend?',
        type: 'likert',
        category: 'eNPS',
        required: true,
      },
      {
        text_es: '¿Algo más que quieras compartir?',
        text_en: "Anything else you'd like to share?",
        type: 'open_ended',
        category: 'Feedback',
        required: false,
      },
    ],
  },
  {
    _id: 'template-wellbeing-check',
    name: 'Wellbeing & Work-Life Balance',
    description:
      'Assess employee wellbeing, stress levels, and work-life balance',
    category: 'wellbeing',
    tags: ['wellbeing', 'stress', 'work-life balance', 'mental health'],
    estimated_duration: 5,
    target_audience: 'All employees',
    is_default: true,
    usage_count: 189,
    created_at: '2025-01-20T10:00:00Z',
    questions: [
      {
        text_es: '¿Cómo calificas tu balance vida-trabajo actualmente?',
        text_en: 'How would you rate your current work-life balance?',
        type: 'emoji_rating',
        category: 'Work-Life Balance',
        required: true,
      },
      {
        text_es: '¿Te sientes agobiado por la carga de trabajo?',
        text_en: 'Do you feel overwhelmed by your workload?',
        type: 'likert',
        category: 'Workload',
        required: true,
      },
      {
        text_es:
          '¿Tienes acceso a los recursos que necesitas para manejar el estrés?',
        text_en: 'Do you have access to resources you need to manage stress?',
        type: 'likert',
        category: 'Support',
        required: true,
      },
      {
        text_es:
          '¿Qué tan cómodo te sientes hablando sobre tu bienestar con tu supervisor?',
        text_en:
          'How comfortable do you feel discussing wellbeing with your supervisor?',
        type: 'likert',
        category: 'Communication',
        required: true,
      },
      {
        text_es: '¿Qué podríamos hacer para mejorar tu bienestar?',
        text_en: 'What could we do to improve your wellbeing?',
        type: 'open_ended',
        category: 'Suggestions',
        required: false,
      },
    ],
  },
  {
    _id: 'template-leadership-feedback',
    name: 'Leadership Effectiveness',
    description:
      'Gather anonymous feedback on leadership and management effectiveness',
    category: 'leadership',
    tags: ['leadership', 'management', 'feedback', 'development'],
    estimated_duration: 7,
    target_audience: 'Team members',
    is_default: true,
    usage_count: 134,
    created_at: '2025-02-01T10:00:00Z',
    questions: [
      {
        text_es: '¿Tu líder comunica claramente las expectativas?',
        text_en: 'Does your leader clearly communicate expectations?',
        type: 'likert',
        category: 'Communication',
        required: true,
      },
      {
        text_es: '¿Recibes retroalimentación constructiva de tu líder?',
        text_en: 'Do you receive constructive feedback from your leader?',
        type: 'likert',
        category: 'Feedback',
        required: true,
      },
      {
        text_es: '¿Tu líder apoya tu desarrollo profesional?',
        text_en: 'Does your leader support your professional development?',
        type: 'likert',
        category: 'Development',
        required: true,
      },
      {
        text_es: '¿Te sientes escuchado y valorado por tu líder?',
        text_en: 'Do you feel heard and valued by your leader?',
        type: 'likert',
        category: 'Recognition',
        required: true,
      },
      {
        text_es: '¿Qué debería seguir haciendo tu líder?',
        text_en: 'What should your leader continue doing?',
        type: 'open_ended',
        category: 'Strengths',
        required: false,
      },
      {
        text_es: '¿Qué podría mejorar tu líder?',
        text_en: 'What could your leader improve?',
        type: 'open_ended',
        category: 'Improvements',
        required: false,
      },
    ],
  },
  {
    _id: 'template-team-collaboration',
    name: 'Team Collaboration Check',
    description:
      'Evaluate team dynamics, collaboration, and communication effectiveness',
    category: 'teamwork',
    tags: ['teamwork', 'collaboration', 'communication', 'culture'],
    estimated_duration: 6,
    target_audience: 'Team members',
    is_default: true,
    usage_count: 167,
    created_at: '2025-02-10T10:00:00Z',
    questions: [
      {
        text_es: '¿Qué tan bien colabora tu equipo?',
        text_en: 'How well does your team collaborate?',
        type: 'emoji_rating',
        category: 'Collaboration',
        required: true,
      },
      {
        text_es: '¿La comunicación en el equipo es clara y efectiva?',
        text_en: 'Is communication within the team clear and effective?',
        type: 'likert',
        category: 'Communication',
        required: true,
      },
      {
        text_es: '¿Todos los miembros del equipo contribuyen equitativamente?',
        text_en: 'Do all team members contribute equitably?',
        type: 'likert',
        category: 'Contribution',
        required: true,
      },
      {
        text_es: '¿Te sientes cómodo compartiendo ideas con tu equipo?',
        text_en: 'Do you feel comfortable sharing ideas with your team?',
        type: 'likert',
        category: 'Psychological Safety',
        required: true,
      },
      {
        text_es: '¿Qué está funcionando bien en tu equipo?',
        text_en: 'What is working well in your team?',
        type: 'open_ended',
        category: 'Strengths',
        required: false,
      },
      {
        text_es: '¿Qué podría mejorar la colaboración del equipo?',
        text_en: 'What could improve team collaboration?',
        type: 'open_ended',
        category: 'Improvements',
        required: false,
      },
    ],
  },
  {
    _id: 'template-post-meeting',
    name: 'Post-Meeting Feedback',
    description: 'Quick feedback after important meetings or events',
    category: 'communication',
    tags: ['meeting', 'feedback', 'quick', 'improvement'],
    estimated_duration: 2,
    target_audience: 'Meeting participants',
    is_default: true,
    usage_count: 312,
    created_at: '2025-03-01T10:00:00Z',
    questions: [
      {
        text_es: '¿Qué tan productiva fue la reunión?',
        text_en: 'How productive was the meeting?',
        type: 'emoji_rating',
        category: 'Effectiveness',
        required: true,
      },
      {
        text_es: '¿Los objetivos de la reunión estuvieron claros?',
        text_en: 'Were the meeting objectives clear?',
        type: 'likert',
        category: 'Clarity',
        required: true,
      },
      {
        text_es: '¿Tuviste oportunidad de participar?',
        text_en: 'Did you have an opportunity to participate?',
        type: 'likert',
        category: 'Participation',
        required: true,
      },
      {
        text_es: '¿Qué mejorarías para la próxima reunión?',
        text_en: 'What would you improve for the next meeting?',
        type: 'open_ended',
        category: 'Improvements',
        required: false,
      },
    ],
  },
];

// GET /api/microclimate-templates - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();
    const language = searchParams.get('language') || 'es';

    let filteredTemplates = [...DEFAULT_TEMPLATES];

    // Filter by category
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(
        (t) => t.category === category
      );
    }

    // Filter by search term
    if (search) {
      filteredTemplates = filteredTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Sort by usage count (most popular first)
    filteredTemplates.sort(
      (a, b) => (b.usage_count || 0) - (a.usage_count || 0)
    );

    return NextResponse.json({
      templates: filteredTemplates,
      total: filteredTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/microclimate-templates - Create custom template (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can create templates
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.description || !body.questions?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new template
    const newTemplate: MicroclimateTemplate = {
      _id: `template-custom-${Date.now()}`,
      name: body.name,
      description: body.description,
      category: body.category || 'custom',
      tags: body.tags || [],
      questions: body.questions,
      estimated_duration: body.estimated_duration || 5,
      target_audience: body.target_audience || 'All employees',
      created_by: session.user.id,
      is_default: false,
      usage_count: 0,
      created_at: new Date().toISOString(),
    };

    // TODO: Save to database when schema is ready
    // For now, just return it

    return NextResponse.json({
      template: newTemplate,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
