export enum InputType {
  CONVERSATIONAL = 'conversational',
  CODE_REQUEST = 'code_request',
  QUESTION = 'question',
  COMMAND = 'command',
  AMBIGUOUS = 'ambiguous'
}

export interface ClassifiedInput {
  type: InputType;
  confidence: number;
  metadata: {
    keywords: string[];
    intent: string;
    context: string;
    urgency?: 'low' | 'medium' | 'high';
  };
  originalInput: string;
}

export class InputClassifier {
  private static readonly PATTERNS = {
    [InputType.CONVERSATIONAL]: [
      /\b(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy|greetings)\b/i,
      /\b(thanks?|thank\s+you|appreciate|grateful)\b/i,
      /\b(bye|goodbye|see\s+you|farewell)\b/i,
      /\b(how\s+are\s+you|what'?s\s+up|sup|how\s+do\s+you\s+do)\b/i,
      /\b(nice|great|awesome|cool|amazing)\b/i,
      /\b(chat|talk|conversation|discuss)\b/i
    ],
    [InputType.CODE_REQUEST]: [
      /\b(create|build|make|generate|implement|write|develop|code)\b/i,
      /\b(component|function|class|module|script|program)\b/i,
      /\b(website|app|application|project|system)\b/i,
      /\b(html|css|javascript|js|typescript|ts|react|vue|angular)\b/i,
      /\b(add|new|feature|functionality)\b/i,
      /\b(update|modify|change|improve|refactor)\b/i
    ],
    [InputType.QUESTION]: [
      /\b(what|how|why|when|where|who|which)\b/i,
      /\b(explain|describe|tell\s+me|can\s+you)\b/i,
      /\b(help|assist|guide|support)\b/i,
      /\b(meaning|definition|purpose|function)\b/i,
      /\b(difference|comparison|versus|vs)\b/i
    ],
    [InputType.COMMAND]: [
      /\b(run|execute|start|stop|launch)\b/i,
      /\b(open|close|save|delete|remove)\b/i,
      /\b(install|setup|configure|deploy)\b/i,
      /\b(test|check|verify|validate)\b/i,
      /\b(build|compile|package|bundle)\b/i
    ]
  };

  private static readonly KEYWORDS = {
    [InputType.CONVERSATIONAL]: [
      'hi', 'hello', 'hey', 'thanks', 'bye', 'goodbye', 'how are you',
      'what\'s up', 'nice', 'great', 'awesome', 'chat', 'talk'
    ],
    [InputType.CODE_REQUEST]: [
      'create', 'build', 'make', 'generate', 'implement', 'write', 'code',
      'component', 'function', 'class', 'website', 'app', 'add', 'new'
    ],
    [InputType.QUESTION]: [
      'what', 'how', 'why', 'when', 'where', 'who', 'explain', 'help',
      'what is', 'how to', 'why does', 'can you'
    ],
    [InputType.COMMAND]: [
      'run', 'execute', 'open', 'close', 'save', 'delete', 'install',
      'setup', 'test', 'build', 'start', 'stop'
    ]
  };

  private static readonly DECISION_MATRIX = {
    // [patternMatches, keywordMatches, length, hasQuestionMark]
    [InputType.CONVERSATIONAL]: {
      weights: [0.3, 0.4, 0.2, 0.1],
      thresholds: { high: 0.8, medium: 0.6, low: 0.4 }
    },
    [InputType.CODE_REQUEST]: {
      weights: [0.4, 0.4, 0.1, 0.1],
      thresholds: { high: 0.75, medium: 0.55, low: 0.35 }
    },
    [InputType.QUESTION]: {
      weights: [0.3, 0.3, 0.2, 0.2],
      thresholds: { high: 0.8, medium: 0.6, low: 0.4 }
    },
    [InputType.COMMAND]: {
      weights: [0.4, 0.3, 0.2, 0.1],
      thresholds: { high: 0.75, medium: 0.55, low: 0.35 }
    }
  };

  static classify(input: string): ClassifiedInput {
    const cleanInput = input.trim().toLowerCase();
    if (!cleanInput) {
      return this.createAmbiguousResult(input, 'Empty input');
    }

    const scores = this.calculateScores(cleanInput);
    const bestMatch = this.findBestMatch(scores);

    if (bestMatch.confidence < 0.3) {
      return this.createAmbiguousResult(input, 'Low confidence match');
    }

    return {
      type: bestMatch.type,
      confidence: bestMatch.confidence,
      metadata: this.extractMetadata(cleanInput, bestMatch.type),
      originalInput: input
    };
  }

  private static calculateScores(input: string): Record<InputType, number> {
    const scores: Record<InputType, number> = {
      [InputType.CONVERSATIONAL]: 0,
      [InputType.CODE_REQUEST]: 0,
      [InputType.QUESTION]: 0,
      [InputType.COMMAND]: 0,
      [InputType.AMBIGUOUS]: 0
    };

    // Calculate pattern matches
    Object.entries(this.PATTERNS).forEach(([type, patterns]) => {
      const patternScore = patterns.reduce((score, pattern) => {
        return score + (pattern.test(input) ? 1 : 0);
      }, 0) / patterns.length;
      scores[type as InputType] = patternScore;
    });

    // Calculate keyword matches
    Object.entries(this.KEYWORDS).forEach(([type, keywords]) => {
      const keywordScore = keywords.reduce((score, keyword) => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return score + (regex.test(input) ? 1 : 0);
      }, 0) / Math.max(keywords.length, 1);
      scores[type as InputType] = (scores[type as InputType] + keywordScore) / 2;
    });

    // Length factor (shorter inputs tend to be conversational/commands)
    const lengthScore = Math.max(0, 1 - (input.length / 200));
    if (input.length < 50) {
      scores[InputType.CONVERSATIONAL] += lengthScore * 0.2;
      scores[InputType.COMMAND] += lengthScore * 0.1;
    }

    // Question mark factor
    const hasQuestionMark = input.includes('?');
    if (hasQuestionMark) {
      scores[InputType.QUESTION] += 0.3;
    }

    return scores;
  }

  private static findBestMatch(scores: Record<InputType, number>): { type: InputType; confidence: number } {
    let bestType = InputType.AMBIGUOUS;
    let bestScore = 0;

    Object.entries(scores).forEach(([type, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as InputType;
      }
    });

    return { type: bestType, confidence: bestScore };
  }

  private static extractMetadata(input: string, type: InputType): ClassifiedInput['metadata'] {
    const keywords = this.extractKeywords(input, type);
    const intent = this.determineIntent(input, type);
    const context = this.extractContext(input);
    const urgency = this.determineUrgency(input, type);

    return {
      keywords,
      intent,
      context,
      urgency
    };
  }

  private static extractKeywords(input: string, type: InputType): string[] {
    const typeKeywords = this.KEYWORDS[type] || [];
    return typeKeywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(input);
    });
  }

  private static determineIntent(input: string, type: InputType): string {
    switch (type) {
      case InputType.CONVERSATIONAL:
        if (/\b(thanks?|thank\s+you|appreciate)\b/i.test(input)) return 'gratitude';
        if (/\b(bye|goodbye|see\s+you)\b/i.test(input)) return 'farewell';
        if (/\b(hi|hello|hey)\b/i.test(input)) return 'greeting';
        return 'general_chat';

      case InputType.CODE_REQUEST:
        if (/\b(create|build|make)\b/i.test(input)) return 'creation';
        if (/\b(update|modify|change)\b/i.test(input)) return 'modification';
        if (/\b(implement|add)\b/i.test(input)) return 'implementation';
        return 'development';

      case InputType.QUESTION:
        if (/\b(what|how|why)\b/i.test(input)) return 'explanation';
        if (/\b(help|assist)\b/i.test(input)) return 'assistance';
        return 'information';

      case InputType.COMMAND:
        if (/\b(run|execute|start)\b/i.test(input)) return 'execution';
        if (/\b(open|close)\b/i.test(input)) return 'file_operation';
        if (/\b(install|setup)\b/i.test(input)) return 'configuration';
        return 'system_action';

      default:
        return 'unknown';
    }
  }

  private static extractContext(input: string): string {
    // Extract programming languages, frameworks, or technologies mentioned
    const techPatterns = [
      /\b(react|vue|angular|javascript|typescript|python|java|php|c\+\+|c#|go|rust)\b/gi,
      /\b(html|css|sass|scss|less|tailwind|bootstrap|material)\b/gi,
      /\b(node|express|django|flask|spring|laravel|rails)\b/gi,
      /\b(mongo|mysql|postgres|sqlite|redis)\b/gi
    ];

    const technologies = techPatterns.flatMap(pattern => {
      const matches = input.match(pattern);
      return matches || [];
    });

    if (technologies.length > 0) {
      return `Technology context: ${technologies.join(', ')}`;
    }

    // Extract file types or project types
    const filePatterns = /\b(\w+\.(js|ts|jsx|tsx|py|java|cpp|html|css|json|md))\b/gi;
    const files = input.match(filePatterns);
    if (files) {
      return `File context: ${files.join(', ')}`;
    }

    return 'General context';
  }

  private static determineUrgency(input: string, type: InputType): 'low' | 'medium' | 'high' {
    // High urgency indicators
    if (/\b(urgent|emergency|critical|asap|immediately|now)\b/i.test(input)) {
      return 'high';
    }

    // Medium urgency for questions and commands
    if (type === InputType.QUESTION || type === InputType.COMMAND) {
      return 'medium';
    }

    // Low urgency for conversational and code requests
    return 'low';
  }

  private static createAmbiguousResult(input: string, reason: string): ClassifiedInput {
    return {
      type: InputType.AMBIGUOUS,
      confidence: 0,
      metadata: {
        keywords: [],
        intent: 'unclear',
        context: reason
      },
      originalInput: input
    };
  }
}