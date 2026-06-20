export interface ConversationSummary {
  id: string;
  title: string;
  model: string;
  modelLock?: string | null;
  thinkingEnabled?: boolean;
  projectId?: string | null;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  reasoningContent?: string | null;
  tokenCount?: number | null;
  cacheHitTokens?: number | null;
  cacheMissTokens?: number | null;
  createdAt?: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
}

export interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  category?: string | null;
  categoryConfidence?: number | null;
  enhancementStatus?: string;
  processingMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface QuickActionSummary {
  id: string;
  title: string;
  prompt: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  type: string;
  defaultModel?: string | null;
  thinkingEnabled?: boolean;
  updatedAt: string;
  _count: { conversations: number; files: number };
}

export interface ProjectDetail extends ProjectSummary {
  files: ProjectFile[];
  conversations: ConversationSummary[];
  quickActions?: QuickActionSummary[];
}

export interface ArtifactSummary {
  id: string;
  title: string;
  type: string;
  format?: string;
  conversationId?: string | null;
  messageId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ArtifactDetail extends ArtifactSummary {
  content: string;
}

export interface ConversionSummary {
  id: string;
  title: string;
  originalName: string;
  status: string;
  pageCount: number | null;
  createdAt: string;
}

export interface ConversionDetail extends ConversionSummary {
  markdownContent: string;
  assets: Array<{ id: string; relativePath: string }>;
  fileSize: number | null;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}
