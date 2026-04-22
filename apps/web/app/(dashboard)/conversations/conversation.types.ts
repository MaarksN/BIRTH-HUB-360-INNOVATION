export type ConversationListItem = {
  channel: string;
  createdAt: string;
  customerReference: string | null;
  id: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  leadReference: string | null;
  messageCount: number;
  status: string;
  subject: string | null;
  updatedAt: string;
};

export type ConversationDetail = {
  channel: string;
  createdAt: string;
  customerReference: string | null;
  id: string;
  leadReference: string | null;
  messages: Array<{
    content: string;
    createdAt: string;
    direction: string;
    id: string;
    role: string | null;
  }>;
  status: string;
  subject: string | null;
  updatedAt: string;
};

export type ConversationFiltersState = {
  channel: string;
  q: string;
  status: string;
};

export type FilterPayload = {
  channel?: string;
  q?: string;
  status?: string;
};
