import psycopg
from dotenv import load_dotenv
from langchain.tools import tool
from langchain_chroma import Chroma
from langchain.agents import create_react_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores.upstash import UpstashVectorStore

# ============================================================================
# CORE COMPONENTS
# ============================================================================

class Store:
    """Handles Postgres operations"""

    def __init__(self, db_conn, db_cursor):
        self.db_conn = db_conn
        self.db_cursor = db_cursor
    
    def update_section(self, section_id: str, content: str):
        """
        1. Embed section content
        2. Insert into Postgres with metadata
        """
    
    def get_section_summary(self, document_id: str) -> str:
        """Fetch cached document summary from DB"""
    
    def store_section_summary(self, document_id: str, summary: str):
        """Store document summary for long-term memory"""

    def create_conversation(document_id: str) -> str:
        """Create a new conversation thread in DB and return thread_id"""

    def add_message(document_id: str, thread_id: str, role: str, content: str) -> None:
        """Add a message to a conversation thread in DB"""

# ============================================================================
# TOOLS
# ============================================================================

@tool(name="queryRouter", description="Classifies user intent → routes to correct handler")
def query_router(query):
     """
    LLM Call: "What is the user trying to do?"
    
    Returns:
    {
        intent: "edit" | "question" | "generate" | "summarize",
        scope: "section" | "document" | "global",
        requires_context: bool
    }
    """

@tool(name="queryOptimizer", description="Optimizes and decomposes queries for better retrieval")
def query_optimizer(query, scope):
    """
    Do reciprocal_rank_fusion

    LLM Call: "Rewrite this query to be more specific"
    
    Returns:
    {
        optimized_query: "clearer version",
        sub_queries: ["query1", "query2"],
        entities: ["Alice", "Chapter 3"],
        filters: {chapter: 3, character: "Alice"}
    }
    """

@tool(name="retrieve", description="Retrieves relevant document sections based on query and scope") 
def retrieve(query, scope, filters):
    """
    1. Determine k based on scope:
        - section: k=3
        - document: k=5  
        - global: k=10
    
    2. Call VectorStore.similarity_search(query, k, filters)
    
    3. If scope is broad (document/global):
        - Also fetch document summaries
        - Prepend summaries to results
    
    4. Return ranked chunks 
    """

@tool(name="generate", description="Generates new content based on user request and context") 
def generate(request, context_docs):
    """
    LLM Call: "Generate content based on this context"
    
    Prompt includes:
    - User's generation request
    - Retrieved context documents
    - Style/tone consistency instructions
    
    Returns: Generated text
    """

@tool(name="summarize", description="Summarizes a section of a document for long-term memory") 
def summarize():
    """
    1. Retrieve ALL sections for document_id
    2. Concatenate content
    3. LLM Call: "Summarize this document"
    4. Store summary in VectorStore
    5. Return summary
    """

@tool(name="storeLtm", description="Stores important user details into long-term memory")
def store_ltm(text: str, document_id: str, thread_id: str) -> str:
    """Store a memory for a specific user and conversation thread. For long-term memory."""
    memory_vectorstore.add_texts([text], metadatas={"document_id": document_id, "thread_id": thread_id})
    return "Memory stored successfully."

@tool(name="recallLtm", description="Recalls relevant memories for a user and thread from long-term memory")
def recall_ltm(query: str, document_id: str, thread_id: str) -> list[str]:
    """Retrieve relevant memories for a specific user and thread. For long-term memory."""
    results = memory_vectorstore.similarity_search(query, k=3, filter={"document_id": document_id, "thread_id": thread_id})
    return [r.page_content for r in results]

# ============================================================================
# AGENT 
# ============================================================================
db_conn = psycopg.connect(dbname="scribo", user="postgres", password="root", host="localhost", port="5432")
db_cursor = db_conn.cursor()

checkpointer = PostgresSaver(db_conn)
embeddings = OpenAIEmbeddings()
memory_vectorstore = Chroma(persist_directory="./chromadb", embedding_function=embeddings) 
document_vectorstore = UpstashVectorStore(namespace="scribo", embedding=embeddings)
tools = [query_router, query_optimizer, retrieve, generate, summarize, store_ltm, recall_ltm]
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)
prompt = """

"""

def create_prompt(state):
    return [{"role": "system", "content": prompt}] + state['messages']

agent = create_react_agent(
    model=llm,
    tools=tools,
    prompt=create_prompt,
    checkpointer=checkpointer,
)
