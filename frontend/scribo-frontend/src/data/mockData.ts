export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  description: string;
}

export interface Section {
  id: string;
  documentId: string;
  title: string;
  content: string;
  preview: string;
  order: number;
}

export const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Product Requirements Document",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
    owner: "John Doe",
    description: "Comprehensive PRD for the new feature release"
  },
  {
    id: "2", 
    title: "API Documentation",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T16:20:00Z",
    owner: "Jane Smith",
    description: "Complete API reference and integration guide"
  },
  {
    id: "3",
    title: "Marketing Strategy",
    createdAt: "2024-01-05T11:00:00Z", 
    updatedAt: "2024-01-22T13:30:00Z",
    owner: "Mike Johnson",
    description: "Q1 marketing strategy and campaign planning"
  }
];

export const mockSections: Section[] = [
  {
    id: "1-1",
    documentId: "1",
    title: "Overview",
    content: "<h2>Product Overview</h2><p>This document outlines the requirements for our next major feature release. The goal is to improve user engagement by 25% and reduce onboarding time by 40%.</p><h3>Key Objectives</h3><ul><li>Streamline user onboarding process</li><li>Implement real-time collaboration features</li><li>Enhance mobile responsiveness</li></ul>",
    preview: "This document outlines the requirements for our next major feature release...",
    order: 1
  },
  {
    id: "1-2", 
    documentId: "1",
    title: "User Stories",
    content: "<h2>User Stories</h2><p>As a new user, I want to complete onboarding in under 5 minutes so that I can start using the platform quickly.</p><p>As a team member, I want to collaborate in real-time so that we can work efficiently together.</p>",
    preview: "As a new user, I want to complete onboarding in under 5 minutes...",
    order: 2
  },
  {
    id: "1-3",
    documentId: "1", 
    title: "Technical Requirements",
    content: "<h2>Technical Requirements</h2><p>The system must support:</p><ul><li>Real-time synchronization across devices</li><li>Offline capability with sync when online</li><li>Mobile-first responsive design</li></ul>",
    preview: "The system must support real-time synchronization across devices...",
    order: 3
  },
  {
    id: "2-1",
    documentId: "2",
    title: "Authentication",
    content: "<h2>Authentication API</h2><p>Our API uses OAuth 2.0 for authentication. All requests must include a valid bearer token.</p><h3>Endpoints</h3><p><code>POST /api/auth/login</code> - User login<br><code>POST /api/auth/refresh</code> - Refresh token</p>",
    preview: "Our API uses OAuth 2.0 for authentication. All requests must include...",
    order: 1
  },
  {
    id: "2-2",
    documentId: "2", 
    title: "User Management",
    content: "<h2>User Management</h2><p>Endpoints for managing user accounts and profiles.</p><h3>Get User Profile</h3><p><code>GET /api/users/me</code></p><p>Returns the authenticated user's profile information.</p>",
    preview: "Endpoints for managing user accounts and profiles...",
    order: 2
  },
  {
    id: "3-1",
    documentId: "3",
    title: "Campaign Strategy", 
    content: "<h2>Q1 Campaign Strategy</h2><p>Our Q1 marketing focus will be on user acquisition and brand awareness.</p><h3>Key Channels</h3><ul><li>Social media advertising</li><li>Content marketing</li><li>Email campaigns</li></ul>",
    preview: "Our Q1 marketing focus will be on user acquisition and brand awareness...",
    order: 1
  }
];

export const getDocumentById = (id: string): Document | undefined => {
  return mockDocuments.find(doc => doc.id === id);
};

export const getSectionsByDocumentId = (documentId: string): Section[] => {
  return mockSections.filter(section => section.documentId === documentId);
};

export const getSectionById = (sectionId: string): Section | undefined => {
  return mockSections.find(section => section.id === sectionId);
};