/**
 * Advanced NLP and Text Analysis Module
 * Implements topic modeling, entity recognition, sentiment trend analysis,
 * and automated theme categorization and tagging
 */

import natural from 'natural';
import { TfIdf } from 'natural';
import sentiment from 'sentiment';

// Types for advanced NLP
export interface TopicModel {
  topics: Topic[];
  documentTopics: DocumentTopic[];
  coherenceScore: number;
  totalDocuments: number;
}

export interface Topic {
  id: string;
  name: string;
  keywords: TopicKeyword[];
  weight: number;
  documents: number;
  sentiment: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface TopicKeyword {
  word: string;
  weight: number;
  frequency: number;
}

export interface DocumentTopic {
  documentId: string;
  topics: TopicAssignment[];
  primaryTopic: string;
  confidence: number;
}

export interface TopicAssignment {
  topicId: string;
  probability: number;
}

export interface EntityRecognition {
  entities: OrganizationalEntity[];
  relationships: EntityRelationship[];
  confidence: number;
}

export interface OrganizationalEntity {
  text: string;
  type: EntityType;
  frequency: number;
  sentiment: number;
  context: string[];
  relevance: number;
}

export type EntityType =
  | 'department'
  | 'role'
  | 'process'
  | 'tool'
  | 'policy'
  | 'person'
  | 'location'
  | 'project'
  | 'skill'
  | 'challenge'
  | 'opportunity';

export interface EntityRelationship {
  source: string;
  target: string;
  relationship: RelationshipType;
  strength: number;
  sentiment: number;
}

export type RelationshipType =
  | 'works_with'
  | 'reports_to'
  | 'uses'
  | 'affects'
  | 'improves'
  | 'hinders'
  | 'depends_on';

export interface SentimentTrend {
  timeframe: string;
  overallSentiment: SentimentScore;
  trends: SentimentTimeSeries[];
  topicSentiments: TopicSentiment[];
  anomalies: SentimentAnomaly[];
}

export interface SentimentScore {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  classification:
    | 'very_negative'
    | 'negative'
    | 'neutral'
    | 'positive'
    | 'very_positive';
  confidence: number;
}

export interface SentimentTimeSeries {
  date: Date;
  sentiment: SentimentScore;
  volume: number;
  topics: string[];
}

export interface TopicSentiment {
  topicId: string;
  topicName: string;
  sentiment: SentimentScore;
  trend: 'improving' | 'declining' | 'stable';
  changeRate: number;
}

export interface SentimentAnomaly {
  date: Date;
  type: 'spike' | 'drop' | 'volatility';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedTopics: string[];
}

export interface ThemeCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  subCategories: string[];
  parentCategory?: string;
  confidence: number;
}

export interface AutomatedTag {
  tag: string;
  category: string;
  confidence: number;
  frequency: number;
  sentiment: number;
  relatedTags: string[];
}

export interface TextAnalysisResult {
  topicModel: TopicModel;
  entities: EntityRecognition;
  sentimentTrend: SentimentTrend;
  themes: ThemeCategory[];
  tags: AutomatedTag[];
  insights: TextInsight[];
}

export interface TextInsight {
  type: 'topic' | 'sentiment' | 'entity' | 'theme' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendations: string[];
  supportingEvidence: string[];
}

class AdvancedNLP {
  private tfidf: TfIdf;
  private sentimentAnalyzer: any;
  private stopWords: Set<string>;
  private organizationalTerms: Map<string, EntityType>;
  private themeTemplates: Map<string, ThemeCategory>;

  constructor() {
    this.tfidf = new TfIdf();
    this.sentimentAnalyzer = sentiment;
    this.stopWords = new Set(natural.stopwords);
    this.organizationalTerms = new Map();
    this.themeTemplates = new Map();
    this.initializeOrganizationalTerms();
    this.initializeThemeTemplates();
  }

  /**
   * Initialize organizational terms dictionary for entity recognition
   */
  private initializeOrganizationalTerms() {
    this.organizationalTerms = new Map([
      // Departments
      ['hr', 'department'],
      ['human resources', 'department'],
      ['it', 'department'],
      ['engineering', 'department'],
      ['sales', 'department'],
      ['marketing', 'department'],
      ['finance', 'department'],
      ['operations', 'department'],
      ['customer service', 'department'],

      // Roles
      ['manager', 'role'],
      ['director', 'role'],
      ['supervisor', 'role'],
      ['lead', 'role'],
      ['analyst', 'role'],
      ['coordinator', 'role'],
      ['specialist', 'role'],
      ['executive', 'role'],

      // Processes
      ['onboarding', 'process'],
      ['training', 'process'],
      ['review', 'process'],
      ['feedback', 'process'],
      ['meeting', 'process'],
      ['planning', 'process'],
      ['development', 'process'],
      ['evaluation', 'process'],

      // Tools
      ['software', 'tool'],
      ['system', 'tool'],
      ['platform', 'tool'],
      ['application', 'tool'],
      ['dashboard', 'tool'],
      ['database', 'tool'],
      ['email', 'tool'],
      ['slack', 'tool'],

      // Policies
      ['policy', 'policy'],
      ['procedure', 'policy'],
      ['guideline', 'policy'],
      ['standard', 'policy'],
      ['protocol', 'policy'],
      ['rule', 'policy'],
      ['regulation', 'policy'],

      // Challenges
      ['problem', 'challenge'],
      ['issue', 'challenge'],
      ['difficulty', 'challenge'],
      ['obstacle', 'challenge'],
      ['bottleneck', 'challenge'],
      ['constraint', 'challenge'],
      ['barrier', 'challenge'],

      // Opportunities
      ['opportunity', 'opportunity'],
      ['improvement', 'opportunity'],
      ['enhancement', 'opportunity'],
      ['innovation', 'opportunity'],
      ['growth', 'opportunity'],
      ['development', 'opportunity'],
    ]);
  }

  /**
   * Initialize theme templates for categorization
   */
  private initializeThemeTemplates() {
    this.themeTemplates = new Map([
      [
        'communication',
        {
          id: 'communication',
          name: 'Communication',
          description:
            'Issues and feedback related to organizational communication',
          keywords: [
            'communicate',
            'information',
            'message',
            'update',
            'feedback',
            'meeting',
            'email',
          ],
          subCategories: [
            'internal_communication',
            'leadership_communication',
            'team_communication',
          ],
          confidence: 0.8,
        },
      ],
      [
        'leadership',
        {
          id: 'leadership',
          name: 'Leadership & Management',
          description:
            'Feedback about leadership effectiveness and management practices',
          keywords: [
            'leader',
            'manager',
            'supervisor',
            'direction',
            'vision',
            'guidance',
            'support',
          ],
          subCategories: [
            'leadership_style',
            'decision_making',
            'support',
            'vision',
          ],
          confidence: 0.8,
        },
      ],
      [
        'worklife_balance',
        {
          id: 'worklife_balance',
          name: 'Work-Life Balance',
          description:
            'Comments about work-life balance, stress, and wellbeing',
          keywords: [
            'balance',
            'stress',
            'workload',
            'overtime',
            'flexible',
            'remote',
            'wellbeing',
          ],
          subCategories: [
            'workload',
            'flexibility',
            'stress_management',
            'time_management',
          ],
          confidence: 0.8,
        },
      ],
      [
        'career_development',
        {
          id: 'career_development',
          name: 'Career Development',
          description:
            'Feedback about growth opportunities and professional development',
          keywords: [
            'career',
            'development',
            'growth',
            'training',
            'promotion',
            'skill',
            'learning',
          ],
          subCategories: [
            'training',
            'promotion',
            'skill_development',
            'mentoring',
          ],
          confidence: 0.8,
        },
      ],
      [
        'team_collaboration',
        {
          id: 'team_collaboration',
          name: 'Team Collaboration',
          description:
            'Comments about teamwork, collaboration, and interpersonal relationships',
          keywords: [
            'team',
            'collaborate',
            'cooperation',
            'together',
            'support',
            'help',
            'relationship',
          ],
          subCategories: [
            'teamwork',
            'cross_functional',
            'support',
            'conflict_resolution',
          ],
          confidence: 0.8,
        },
      ],
      [
        'tools_resources',
        {
          id: 'tools_resources',
          name: 'Tools & Resources',
          description:
            'Feedback about tools, systems, and resources needed for work',
          keywords: [
            'tool',
            'system',
            'resource',
            'equipment',
            'software',
            'technology',
            'access',
          ],
          subCategories: [
            'technology',
            'equipment',
            'access',
            'training_resources',
          ],
          confidence: 0.8,
        },
      ],
      [
        'culture_values',
        {
          id: 'culture_values',
          name: 'Culture & Values',
          description:
            'Comments about organizational culture, values, and environment',
          keywords: [
            'culture',
            'values',
            'environment',
            'atmosphere',
            'diversity',
            'inclusion',
            'respect',
          ],
          subCategories: [
            'values_alignment',
            'diversity_inclusion',
            'environment',
            'recognition',
          ],
          confidence: 0.8,
        },
      ],
      [
        'processes_efficiency',
        {
          id: 'processes_efficiency',
          name: 'Processes & Efficiency',
          description:
            'Feedback about work processes, efficiency, and operational improvements',
          keywords: [
            'process',
            'procedure',
            'efficient',
            'workflow',
            'streamline',
            'improve',
            'optimize',
          ],
          subCategories: [
            'workflow',
            'efficiency',
            'automation',
            'standardization',
          ],
          confidence: 0.8,
        },
      ],
    ]);
  }

  /**
   * Perform comprehensive topic modeling on text responses
   */
  async performTopicModeling(
    documents: string[],
    numTopics: number = 8,
    minDocumentFreq: number = 2
  ): Promise<TopicModel> {
    if (documents.length === 0) {
      return {
        topics: [],
        documentTopics: [],
        coherenceScore: 0,
        totalDocuments: 0,
      };
    }

    // Preprocess documents
    const processedDocs = documents.map((doc) => this.preprocessText(doc));

    // Build TF-IDF matrix
    const tfidf = new TfIdf();
    processedDocs.forEach((doc) => tfidf.addDocument(doc));

    // Extract terms and their frequencies
    const termFrequencies = new Map<string, number>();
    const documentTerms = new Map<number, Map<string, number>>();

    for (let i = 0; i < processedDocs.length; i++) {
      const docTerms = new Map<string, number>();
      const terms = tfidf.listTerms(i);

      terms.forEach((term) => {
        if (term.tfidf > 0.1 && !this.stopWords.has(term.term)) {
          termFrequencies.set(
            term.term,
            (termFrequencies.get(term.term) || 0) + 1
          );
          docTerms.set(term.term, term.tfidf);
        }
      });

      documentTerms.set(i, docTerms);
    }

    // Filter terms by minimum document frequency
    const validTerms = Array.from(termFrequencies.entries())
      .filter(([term, freq]) => freq >= minDocumentFreq)
      .map(([term]) => term);

    // Simple topic modeling using term clustering
    const topics = await this.clusterTermsIntoTopics(
      validTerms,
      termFrequencies,
      numTopics
    );

    // Assign documents to topics
    const documentTopics = this.assignDocumentsToTopics(documentTerms, topics);

    // Calculate coherence score
    const coherenceScore = this.calculateCoherenceScore(topics, documentTerms);

    return {
      topics,
      documentTopics,
      coherenceScore,
      totalDocuments: documents.length,
    };
  }

  /**
   * Perform entity recognition to identify organizational themes
   */
  async recognizeEntities(texts: string[]): Promise<EntityRecognition> {
    const entities = new Map<string, OrganizationalEntity>();
    const relationships: EntityRelationship[] = [];

    for (const text of texts) {
      const processedText = text.toLowerCase();
      const tokenizer = new natural.SentenceTokenizer([]);
      const sentences = tokenizer.tokenize(text);

      // Extract entities using pattern matching and dictionary lookup
      for (const [term, type] of this.organizationalTerms.entries()) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = processedText.match(regex);

        if (matches) {
          const entityKey = term.toLowerCase();

          if (!entities.has(entityKey)) {
            entities.set(entityKey, {
              text: term,
              type: type as EntityType,
              frequency: 0,
              sentiment: 0,
              context: [],
              relevance: 0,
            });
          }

          const entity = entities.get(entityKey)!;
          entity.frequency += matches.length;

          // Extract context sentences
          sentences.forEach((sentence) => {
            if (sentence.toLowerCase().includes(term)) {
              entity.context.push(sentence);

              // Calculate sentiment for this context
              const sentimentResult = this.sentimentAnalyzer.analyze(sentence);
              entity.sentiment =
                (entity.sentiment + sentimentResult.comparative) / 2;
            }
          });
        }
      }
    }

    // Calculate relevance scores
    const maxFrequency = Math.max(
      ...Array.from(entities.values()).map((e) => e.frequency)
    );
    entities.forEach((entity) => {
      entity.relevance = entity.frequency / maxFrequency;
    });

    // Extract relationships between entities
    const entityArray = Array.from(entities.values());
    for (let i = 0; i < entityArray.length; i++) {
      for (let j = i + 1; j < entityArray.length; j++) {
        const relationship = this.extractEntityRelationship(
          entityArray[i],
          entityArray[j],
          texts
        );
        if (relationship) {
          relationships.push(relationship);
        }
      }
    }

    return {
      entities: Array.from(entities.values()),
      relationships,
      confidence: this.calculateEntityConfidence(entities.size, texts.length),
    };
  }

  /**
   * Analyze sentiment trends over time
   */
  async analyzeSentimentTrends(
    textData: Array<{ text: string; date: Date; metadata?: any }>,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<SentimentTrend> {
    if (textData.length === 0) {
      return {
        timeframe,
        overallSentiment: {
          score: 0,
          magnitude: 0,
          classification: 'neutral',
          confidence: 0,
        },
        trends: [],
        topicSentiments: [],
        anomalies: [],
      };
    }

    // Calculate overall sentiment
    const allSentiments = textData.map((item) =>
      this.sentimentAnalyzer.analyze(item.text)
    );
    const overallScore =
      allSentiments.reduce((sum, s) => sum + s.comparative, 0) /
      allSentiments.length;
    const overallMagnitude =
      allSentiments.reduce((sum, s) => sum + Math.abs(s.comparative), 0) /
      allSentiments.length;

    const overallSentiment: SentimentScore = {
      score: overallScore,
      magnitude: overallMagnitude,
      classification: this.classifySentiment(overallScore),
      confidence: this.calculateSentimentConfidence(allSentiments.length),
    };

    // Group data by time periods
    const timeGroups = this.groupByTimeframe(textData, timeframe);

    // Calculate sentiment for each time period
    const trends: SentimentTimeSeries[] = [];
    for (const [period, items] of timeGroups.entries()) {
      const periodSentiments = items.map((item) =>
        this.sentimentAnalyzer.analyze(item.text)
      );
      const avgScore =
        periodSentiments.reduce((sum, s) => sum + s.comparative, 0) /
        periodSentiments.length;
      const avgMagnitude =
        periodSentiments.reduce((sum, s) => sum + Math.abs(s.comparative), 0) /
        periodSentiments.length;

      // Extract topics for this period
      const periodTexts = items.map((item) => item.text);
      const topicModel = await this.performTopicModeling(periodTexts, 3);
      const topTopics = topicModel.topics.slice(0, 3).map((t) => t.name);

      trends.push({
        date: new Date(period),
        sentiment: {
          score: avgScore,
          magnitude: avgMagnitude,
          classification: this.classifySentiment(avgScore),
          confidence: this.calculateSentimentConfidence(
            periodSentiments.length
          ),
        },
        volume: items.length,
        topics: topTopics,
      });
    }

    // Sort trends by date
    trends.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Analyze topic-specific sentiments
    const topicModel = await this.performTopicModeling(
      textData.map((item) => item.text)
    );
    const topicSentiments = await this.analyzeTopicSentiments(
      textData,
      topicModel
    );

    // Detect sentiment anomalies
    const anomalies = this.detectSentimentAnomalies(trends);

    return {
      timeframe,
      overallSentiment,
      trends,
      topicSentiments,
      anomalies,
    };
  }

  /**
   * Automatically categorize and tag text content
   */
  async categorizeAndTag(
    texts: string[]
  ): Promise<{ themes: ThemeCategory[]; tags: AutomatedTag[] }> {
    const themes: ThemeCategory[] = [];
    const tagFrequencies = new Map<
      string,
      { count: number; sentiment: number; category: string }
    >();

    // Categorize texts into themes
    for (const [themeId, template] of this.themeTemplates.entries()) {
      let matchCount = 0;
      let totalSentiment = 0;
      const matchingTexts: string[] = [];

      for (const text of texts) {
        const lowerText = text.toLowerCase();
        const keywordMatches = template.keywords.filter((keyword) =>
          lowerText.includes(keyword.toLowerCase())
        ).length;

        if (keywordMatches > 0) {
          matchCount++;
          const sentiment = this.sentimentAnalyzer.analyze(text);
          totalSentiment += sentiment.comparative;
          matchingTexts.push(text);

          // Extract tags from this text
          this.extractTagsFromText(text, template.name, tagFrequencies);
        }
      }

      if (matchCount > 0) {
        const avgSentiment = totalSentiment / matchCount;
        const confidence = Math.min(
          0.95,
          (matchCount / texts.length) * template.confidence
        );

        themes.push({
          ...template,
          confidence,
          subCategories: template.subCategories || [],
        });
      }
    }

    // Convert tag frequencies to AutomatedTag objects
    const tags: AutomatedTag[] = Array.from(tagFrequencies.entries())
      .map(([tag, data]) => ({
        tag,
        category: data.category,
        confidence: Math.min(0.95, data.count / texts.length),
        frequency: data.count,
        sentiment: data.sentiment / data.count,
        relatedTags: this.findRelatedTags(tag, tagFrequencies),
      }))
      .filter((tag) => tag.frequency >= 2) // Minimum frequency threshold
      .sort((a, b) => b.frequency - a.frequency);

    return { themes, tags };
  }

  /**
   * Generate comprehensive text analysis insights
   */
  async generateTextInsights(
    analysisResult: TextAnalysisResult
  ): Promise<TextInsight[]> {
    const insights: TextInsight[] = [];

    // Topic insights
    if (analysisResult.topicModel.topics.length > 0) {
      const dominantTopic = analysisResult.topicModel.topics[0];
      insights.push({
        type: 'topic',
        title: `Dominant Discussion Topic: ${dominantTopic.name}`,
        description: `${dominantTopic.name} appears in ${dominantTopic.documents} documents with ${dominantTopic.weight.toFixed(2)} relevance weight`,
        confidence: 0.8,
        impact: dominantTopic.weight > 0.3 ? 'high' : 'medium',
        recommendations: [
          `Focus attention on ${dominantTopic.name} related initiatives`,
          'Develop targeted action plans for this area',
          'Monitor sentiment trends for this topic',
        ],
        supportingEvidence: dominantTopic.keywords
          .slice(0, 5)
          .map((k) => k.word),
      });
    }

    // Sentiment insights
    const sentiment = analysisResult.sentimentTrend.overallSentiment;
    if (
      sentiment.classification === 'negative' ||
      sentiment.classification === 'very_negative'
    ) {
      insights.push({
        type: 'sentiment',
        title: 'Negative Sentiment Detected',
        description: `Overall sentiment is ${sentiment.classification} with score ${sentiment.score.toFixed(2)}`,
        confidence: sentiment.confidence,
        impact: 'high',
        recommendations: [
          'Investigate root causes of negative sentiment',
          'Implement immediate improvement initiatives',
          'Increase communication and transparency',
        ],
        supportingEvidence: analysisResult.sentimentTrend.topicSentiments
          .filter((ts) => ts.sentiment.score < -0.2)
          .map((ts) => `${ts.topicName}: ${ts.sentiment.score.toFixed(2)}`),
      });
    }

    // Entity insights
    const highImpactEntities = analysisResult.entities.entities.filter(
      (e) => e.relevance > 0.5 && Math.abs(e.sentiment) > 0.3
    );

    highImpactEntities.forEach((entity) => {
      insights.push({
        type: 'entity',
        title: `${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} Focus: ${entity.text}`,
        description: `${entity.text} mentioned ${entity.frequency} times with ${entity.sentiment > 0 ? 'positive' : 'negative'} sentiment`,
        confidence: 0.7,
        impact: entity.relevance > 0.8 ? 'high' : 'medium',
        recommendations: [
          entity.sentiment < 0
            ? `Address concerns related to ${entity.text}`
            : `Leverage positive aspects of ${entity.text}`,
          'Gather more specific feedback on this area',
        ],
        supportingEvidence: entity.context.slice(0, 3),
      });
    });

    // Theme insights
    const significantThemes = analysisResult.themes.filter(
      (t) => t.confidence > 0.3
    );
    significantThemes.forEach((theme) => {
      insights.push({
        type: 'theme',
        title: `Significant Theme: ${theme.name}`,
        description: theme.description,
        confidence: theme.confidence,
        impact: theme.confidence > 0.6 ? 'high' : 'medium',
        recommendations: [
          `Develop specific initiatives for ${theme.name}`,
          'Create targeted surveys for deeper insights',
          'Assign ownership for improvement in this area',
        ],
        supportingEvidence: theme.keywords,
      });
    });

    // Anomaly insights
    analysisResult.sentimentTrend.anomalies.forEach((anomaly) => {
      insights.push({
        type: 'anomaly',
        title: `Sentiment ${anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} Detected`,
        description: anomaly.description,
        confidence: 0.8,
        impact: anomaly.severity === 'high' ? 'high' : 'medium',
        recommendations: [
          'Investigate the cause of this sentiment change',
          'Review events or changes around this time period',
          'Consider immediate intervention if needed',
        ],
        supportingEvidence: anomaly.affectedTopics,
      });
    });

    // Sort insights by impact and confidence
    return insights.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      const aScore = impactWeight[a.impact] * a.confidence;
      const bScore = impactWeight[b.impact] * b.confidence;
      return bScore - aScore;
    });
  }

  // Helper methods

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async clusterTermsIntoTopics(
    terms: string[],
    frequencies: Map<string, number>,
    numTopics: number
  ): Promise<Topic[]> {
    // Simple clustering based on term co-occurrence and frequency
    const topics: Topic[] = [];
    const usedTerms = new Set<string>();

    // Sort terms by frequency
    const sortedTerms = terms
      .filter((term) => !usedTerms.has(term))
      .sort((a, b) => (frequencies.get(b) || 0) - (frequencies.get(a) || 0));

    for (let i = 0; i < Math.min(numTopics, sortedTerms.length); i++) {
      const seedTerm = sortedTerms[i];
      if (usedTerms.has(seedTerm)) continue;

      const relatedTerms = this.findRelatedTerms(
        seedTerm,
        sortedTerms,
        frequencies
      );
      const topicKeywords: TopicKeyword[] = relatedTerms.map((term) => ({
        word: term,
        weight:
          (frequencies.get(term) || 0) /
          Math.max(...Array.from(frequencies.values())),
        frequency: frequencies.get(term) || 0,
      }));

      topics.push({
        id: `topic_${i}`,
        name: this.generateTopicName(relatedTerms),
        keywords: topicKeywords,
        weight:
          topicKeywords.reduce((sum, kw) => sum + kw.weight, 0) /
          topicKeywords.length,
        documents: 0, // Will be calculated later
        sentiment: 0, // Will be calculated later
        trend: 'stable',
      });

      relatedTerms.forEach((term) => usedTerms.add(term));
    }

    return topics;
  }

  private findRelatedTerms(
    seedTerm: string,
    allTerms: string[],
    frequencies: Map<string, number>
  ): string[] {
    const related = [seedTerm];
    const seedFreq = frequencies.get(seedTerm) || 0;

    // Find terms with similar frequency patterns or semantic similarity
    for (const term of allTerms) {
      if (term === seedTerm || related.includes(term)) continue;

      const termFreq = frequencies.get(term) || 0;
      const freqSimilarity =
        1 - Math.abs(seedFreq - termFreq) / Math.max(seedFreq, termFreq);

      // Simple semantic similarity based on common prefixes/suffixes
      const semanticSimilarity = this.calculateSemanticSimilarity(
        seedTerm,
        term
      );

      if (freqSimilarity > 0.5 || semanticSimilarity > 0.3) {
        related.push(term);
        if (related.length >= 5) break; // Limit topic size
      }
    }

    return related;
  }

  private calculateSemanticSimilarity(term1: string, term2: string): number {
    // Simple similarity based on common substrings and organizational context
    const commonPrefixes = [
      'work',
      'team',
      'manage',
      'lead',
      'develop',
      'commun',
    ];
    const commonSuffixes = ['ing', 'ment', 'tion', 'ness', 'ship'];

    let similarity = 0;

    // Check for common organizational prefixes
    for (const prefix of commonPrefixes) {
      if (term1.startsWith(prefix) && term2.startsWith(prefix)) {
        similarity += 0.3;
        break;
      }
    }

    // Check for common suffixes
    for (const suffix of commonSuffixes) {
      if (term1.endsWith(suffix) && term2.endsWith(suffix)) {
        similarity += 0.2;
        break;
      }
    }

    // Check for substring overlap
    const overlap = this.calculateStringOverlap(term1, term2);
    similarity += overlap * 0.5;

    return Math.min(1, similarity);
  }

  private calculateStringOverlap(str1: string, str2: string): number {
    const shorter = str1.length < str2.length ? str1 : str2;
    const longer = str1.length >= str2.length ? str1 : str2;

    let maxOverlap = 0;
    for (let i = 0; i < shorter.length; i++) {
      for (let j = i + 1; j <= shorter.length; j++) {
        const substring = shorter.substring(i, j);
        if (longer.includes(substring) && substring.length > maxOverlap) {
          maxOverlap = substring.length;
        }
      }
    }

    return maxOverlap / Math.max(str1.length, str2.length);
  }

  private generateTopicName(terms: string[]): string {
    // Generate a meaningful topic name from the terms
    const primaryTerm = terms[0];

    // Check if it matches known organizational themes
    for (const [themeId, template] of this.themeTemplates.entries()) {
      if (
        template.keywords.some((keyword) =>
          terms.includes(keyword.toLowerCase())
        )
      ) {
        return template.name;
      }
    }

    // Generate name based on primary term
    const nameMap: Record<string, string> = {
      work: 'Work Environment',
      team: 'Team Dynamics',
      manage: 'Management',
      lead: 'Leadership',
      commun: 'Communication',
      develop: 'Development',
      train: 'Training',
      support: 'Support Systems',
      process: 'Processes',
      tool: 'Tools & Resources',
    };

    for (const [key, name] of Object.entries(nameMap)) {
      if (primaryTerm.includes(key)) {
        return name;
      }
    }

    return `${primaryTerm.charAt(0).toUpperCase() + primaryTerm.slice(1)} Related`;
  }

  private assignDocumentsToTopics(
    documentTerms: Map<number, Map<string, number>>,
    topics: Topic[]
  ): DocumentTopic[] {
    const documentTopics: DocumentTopic[] = [];

    for (const [docId, terms] of documentTerms.entries()) {
      const topicScores = new Map<string, number>();

      // Calculate similarity to each topic
      for (const topic of topics) {
        let score = 0;
        for (const keyword of topic.keywords) {
          const termScore = terms.get(keyword.word) || 0;
          score += termScore * keyword.weight;
        }
        topicScores.set(topic.id, score);
      }

      // Normalize scores to probabilities
      const totalScore = Array.from(topicScores.values()).reduce(
        (sum, score) => sum + score,
        0
      );
      const topicAssignments: TopicAssignment[] = [];
      let primaryTopic = '';
      let maxProbability = 0;

      for (const [topicId, score] of topicScores.entries()) {
        const probability = totalScore > 0 ? score / totalScore : 0;
        topicAssignments.push({ topicId, probability });

        if (probability > maxProbability) {
          maxProbability = probability;
          primaryTopic = topicId;
        }
      }

      documentTopics.push({
        documentId: docId.toString(),
        topics: topicAssignments,
        primaryTopic,
        confidence: maxProbability,
      });

      // Update topic document counts
      const topic = topics.find((t) => t.id === primaryTopic);
      if (topic) {
        topic.documents++;
      }
    }

    return documentTopics;
  }

  private calculateCoherenceScore(
    topics: Topic[],
    documentTerms: Map<number, Map<string, number>>
  ): number {
    if (topics.length === 0) return 0;

    let totalCoherence = 0;

    for (const topic of topics) {
      let topicCoherence = 0;
      const keywords = topic.keywords.slice(0, 5); // Top 5 keywords

      for (let i = 0; i < keywords.length; i++) {
        for (let j = i + 1; j < keywords.length; j++) {
          const cooccurrence = this.calculateCooccurrence(
            keywords[i].word,
            keywords[j].word,
            documentTerms
          );
          topicCoherence += cooccurrence;
        }
      }

      const pairs = (keywords.length * (keywords.length - 1)) / 2;
      totalCoherence += pairs > 0 ? topicCoherence / pairs : 0;
    }

    return totalCoherence / topics.length;
  }

  private calculateCooccurrence(
    term1: string,
    term2: string,
    documentTerms: Map<number, Map<string, number>>
  ): number {
    let cooccurrences = 0;
    let totalDocs = 0;

    for (const [docId, terms] of documentTerms.entries()) {
      totalDocs++;
      if (terms.has(term1) && terms.has(term2)) {
        cooccurrences++;
      }
    }

    return totalDocs > 0 ? cooccurrences / totalDocs : 0;
  }

  private extractEntityRelationship(
    entity1: OrganizationalEntity,
    entity2: OrganizationalEntity,
    texts: string[]
  ): EntityRelationship | null {
    let cooccurrences = 0;
    let totalSentiment = 0;

    for (const text of texts) {
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes(entity1.text.toLowerCase()) &&
        lowerText.includes(entity2.text.toLowerCase())
      ) {
        cooccurrences++;
        const sentiment = this.sentimentAnalyzer.analyze(text);
        totalSentiment += sentiment.comparative;
      }
    }

    if (cooccurrences < 2) return null; // Minimum threshold

    const relationship = this.inferRelationshipType(entity1, entity2, texts);
    const strength = cooccurrences / texts.length;
    const avgSentiment = totalSentiment / cooccurrences;

    return {
      source: entity1.text,
      target: entity2.text,
      relationship,
      strength,
      sentiment: avgSentiment,
    };
  }

  private inferRelationshipType(
    entity1: OrganizationalEntity,
    entity2: OrganizationalEntity,
    texts: string[]
  ): RelationshipType {
    // Simple rule-based relationship inference
    if (entity1.type === 'role' && entity2.type === 'role') {
      return 'works_with';
    }
    if (entity1.type === 'role' && entity2.type === 'tool') {
      return 'uses';
    }
    if (entity1.type === 'process' && entity2.type === 'tool') {
      return 'uses';
    }
    if (entity1.type === 'challenge' && entity2.type === 'process') {
      return 'hinders';
    }
    if (entity1.type === 'opportunity' && entity2.type === 'process') {
      return 'improves';
    }

    return 'affects'; // Default relationship
  }

  private calculateEntityConfidence(
    entityCount: number,
    textCount: number
  ): number {
    if (textCount === 0) return 0;

    const coverage = entityCount / Math.max(1, textCount / 10); // Expected ~1 entity per 10 texts
    return Math.min(0.95, Math.max(0.3, coverage));
  }

  private classifySentiment(
    score: number
  ): 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive' {
    if (score <= -0.6) return 'very_negative';
    if (score <= -0.2) return 'negative';
    if (score >= 0.6) return 'very_positive';
    if (score >= 0.2) return 'positive';
    return 'neutral';
  }

  private calculateSentimentConfidence(sampleSize: number): number {
    if (sampleSize < 5) return 0.3;
    if (sampleSize < 20) return 0.6;
    if (sampleSize < 50) return 0.8;
    return 0.9;
  }

  private groupByTimeframe(
    data: Array<{ text: string; date: Date; metadata?: any }>,
    timeframe: 'daily' | 'weekly' | 'monthly'
  ): Map<string, Array<{ text: string; date: Date; metadata?: any }>> {
    const groups = new Map();

    data.forEach((item) => {
      let key: string;
      const date = new Date(item.date);

      switch (timeframe) {
        case 'daily':
          key = date.toISOString().substring(0, 10); // YYYY-MM-DD
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().substring(0, 10);
          break;
        case 'monthly':
          key = date.toISOString().substring(0, 7); // YYYY-MM
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
    });

    return groups;
  }

  private async analyzeTopicSentiments(
    textData: Array<{ text: string; date: Date; metadata?: any }>,
    topicModel: TopicModel
  ): Promise<TopicSentiment[]> {
    const topicSentiments: TopicSentiment[] = [];

    for (const topic of topicModel.topics) {
      const topicTexts = textData.filter((item) => {
        const lowerText = item.text.toLowerCase();
        return topic.keywords.some((keyword) =>
          lowerText.includes(keyword.word.toLowerCase())
        );
      });

      if (topicTexts.length === 0) continue;

      const sentiments = topicTexts.map((item) =>
        this.sentimentAnalyzer.analyze(item.text)
      );
      const avgScore =
        sentiments.reduce((sum, s) => sum + s.comparative, 0) /
        sentiments.length;
      const avgMagnitude =
        sentiments.reduce((sum, s) => sum + Math.abs(s.comparative), 0) /
        sentiments.length;

      // Calculate trend (simplified - would need historical data for accurate trend)
      const trend =
        avgScore > 0.1 ? 'improving' : avgScore < -0.1 ? 'declining' : 'stable';
      const changeRate = Math.abs(avgScore) * 100; // Simplified change rate

      topicSentiments.push({
        topicId: topic.id,
        topicName: topic.name,
        sentiment: {
          score: avgScore,
          magnitude: avgMagnitude,
          classification: this.classifySentiment(avgScore),
          confidence: this.calculateSentimentConfidence(sentiments.length),
        },
        trend,
        changeRate,
      });
    }

    return topicSentiments;
  }

  private detectSentimentAnomalies(
    trends: SentimentTimeSeries[]
  ): SentimentAnomaly[] {
    const anomalies: SentimentAnomaly[] = [];

    if (trends.length < 3) return anomalies;

    // Calculate moving average and standard deviation
    const scores = trends.map((t) => t.sentiment.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const stdDev = Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
        scores.length
    );

    // Detect anomalies
    for (let i = 1; i < trends.length - 1; i++) {
      const current = trends[i];
      const prev = trends[i - 1];
      const next = trends[i + 1];

      const deviation = Math.abs(current.sentiment.score - mean);
      const change = Math.abs(current.sentiment.score - prev.sentiment.score);

      // Spike detection
      if (deviation > 2 * stdDev && change > stdDev) {
        anomalies.push({
          date: current.date,
          type: current.sentiment.score > mean ? 'spike' : 'drop',
          severity: deviation > 3 * stdDev ? 'high' : 'medium',
          description: `Unusual ${current.sentiment.score > mean ? 'positive' : 'negative'} sentiment spike detected`,
          affectedTopics: current.topics,
        });
      }

      // Volatility detection
      const volatility =
        Math.abs(current.sentiment.score - prev.sentiment.score) +
        Math.abs(next.sentiment.score - current.sentiment.score);

      if (volatility > 1.5 * stdDev) {
        anomalies.push({
          date: current.date,
          type: 'volatility',
          severity: volatility > 2 * stdDev ? 'high' : 'medium',
          description: 'High sentiment volatility detected',
          affectedTopics: current.topics,
        });
      }
    }

    return anomalies;
  }

  private extractTagsFromText(
    text: string,
    category: string,
    tagFrequencies: Map<
      string,
      { count: number; sentiment: number; category: string }
    >
  ) {
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text.toLowerCase());
    const sentiment = this.sentimentAnalyzer.analyze(text);

    // Extract meaningful phrases and terms
    const phrases = this.extractPhrases(text);
    const allTags = [...words, ...phrases]
      .filter((tag) => tag.length > 2 && !this.stopWords.has(tag))
      .filter((tag) => /^[a-zA-Z\s]+$/.test(tag)); // Only alphabetic characters

    allTags.forEach((tag) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (!tagFrequencies.has(normalizedTag)) {
        tagFrequencies.set(normalizedTag, {
          count: 0,
          sentiment: 0,
          category,
        });
      }

      const tagData = tagFrequencies.get(normalizedTag)!;
      tagData.count++;
      tagData.sentiment += sentiment.comparative;
    });
  }

  private extractPhrases(text: string): string[] {
    // Extract 2-3 word phrases that might be meaningful
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text.toLowerCase());
    const phrases: string[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      // 2-word phrases
      const phrase2 = `${words[i]} ${words[i + 1]}`;
      if (this.isMeaningfulPhrase(phrase2)) {
        phrases.push(phrase2);
      }

      // 3-word phrases
      if (i < words.length - 2) {
        const phrase3 = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (this.isMeaningfulPhrase(phrase3)) {
          phrases.push(phrase3);
        }
      }
    }

    return phrases;
  }

  private isMeaningfulPhrase(phrase: string): boolean {
    const words = phrase.split(' ');

    // Filter out phrases with too many stop words
    const stopWordCount = words.filter((word) =>
      this.stopWords.has(word)
    ).length;
    if (stopWordCount > words.length / 2) return false;

    // Check for organizational relevance
    const organizationalTerms = [
      'work',
      'team',
      'manager',
      'project',
      'meeting',
      'process',
      'system',
      'training',
    ];
    const hasOrgTerm = words.some((word) => organizationalTerms.includes(word));

    return hasOrgTerm || words.every((word) => word.length > 3);
  }

  private findRelatedTags(
    targetTag: string,
    allTags: Map<string, { count: number; sentiment: number; category: string }>
  ): string[] {
    const related: string[] = [];
    const targetWords = targetTag.split(' ');

    for (const [tag, data] of allTags.entries()) {
      if (tag === targetTag) continue;

      const tagWords = tag.split(' ');
      const commonWords = targetWords.filter((word) => tagWords.includes(word));

      if (
        commonWords.length > 0 ||
        this.calculateSemanticSimilarity(targetTag, tag) > 0.3
      ) {
        related.push(tag);
        if (related.length >= 5) break;
      }
    }

    return related;
  }
}

// Export singleton instance
export const advancedNLP = new AdvancedNLP();

// Export utility functions for API routes
export async function performComprehensiveTextAnalysis(
  texts: Array<{ text: string; date: Date; metadata?: any }>
): Promise<TextAnalysisResult> {
  const textStrings = texts.map((t) => t.text);

  // Perform all analyses
  const [topicModel, entities, sentimentTrend, categorization] =
    await Promise.all([
      advancedNLP.performTopicModeling(textStrings),
      advancedNLP.recognizeEntities(textStrings),
      advancedNLP.analyzeSentimentTrends(texts),
      advancedNLP.categorizeAndTag(textStrings),
    ]);

  const result: TextAnalysisResult = {
    topicModel,
    entities,
    sentimentTrend,
    themes: categorization.themes,
    tags: categorization.tags,
    insights: [],
  };

  // Generate insights
  result.insights = await advancedNLP.generateTextInsights(result);

  return result;
}

export async function analyzeTopicEvolution(
  historicalTexts: Array<{ text: string; date: Date; metadata?: any }>,
  timeframe: 'weekly' | 'monthly' = 'monthly'
): Promise<any> {
  // Group texts by time periods
  const timeGroups = new Map();

  historicalTexts.forEach((item) => {
    const key =
      timeframe === 'monthly'
        ? item.date.toISOString().substring(0, 7)
        : item.date.toISOString().substring(0, 10);

    if (!timeGroups.has(key)) {
      timeGroups.set(key, []);
    }
    timeGroups.get(key).push(item.text);
  });

  // Analyze topics for each time period
  const topicEvolution = [];
  for (const [period, texts] of timeGroups.entries()) {
    const topicModel = await advancedNLP.performTopicModeling(texts);
    topicEvolution.push({
      period,
      topics: topicModel.topics,
      coherence: topicModel.coherenceScore,
    });
  }

  return topicEvolution;
}
