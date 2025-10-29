export interface Document {
  id: string;
  user_id: string;
  title: string;
  description: string;
  length: number;
  num_words: number;
  num_sections: number;
  created_at: string;
  updated_at: string;
}

export interface NewDocument {
  user_id: string;
  title: string;
  description: string;
  length: number;
  num_words: number;
  num_sections: number;
}

export interface Section {
  id: string;
  document_id: string;
  title: string;
  content: string;
  summary: string;
  metadata: { [key: string]: string | undefined };
  length: number;
  num_words: number;
  created_at: string;
  updated_at: string;
}

export interface NewSection {
  document_id: string;
  title: string;
  content: string;
  summary: string;
  metadata: { [key: string]: string | undefined };
  length: number;
  num_words: number;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  thread_id?: string;
}

export interface MessageRequest {
  document_id: string;
  section_id: string;
}
