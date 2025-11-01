import json
import psycopg
from typing import List
from flask_cors import CORS
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain.tools import tool
from langchain_chroma import Chroma
from flask import Flask, request, jsonify
from langchain_core.documents import Document
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.upstash import UpstashVectorStore

load_dotenv()

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": "*",
            "supports_credentials": True,
        }
    },
)

# ============================================================================
# CORE COMPONENTS
# ============================================================================
# Database connection
db_conn = psycopg.connect(
    dbname="scribo", user="postgres", password="root", host="localhost", port="5432"
)
db_cursor = db_conn.cursor()

# Embeddings
embeddings = OpenAIEmbeddings()

# Vector stores
memory_vectorstore = Chroma(
    persist_directory="./chromadb", embedding_function=embeddings
)
general_vectorstore = UpstashVectorStore(namespace="general", embedding=embeddings)
section_summary_vectorstore = UpstashVectorStore(
    namespace="summary", embedding=embeddings
)


# Models
class Section(BaseModel):
    id: str
    document_id: str
    title: str
    content: str
    summary: str
    metadata: dict
    length: int
    num_words: int


# Helper functions
def get_docs(
    section: Section,
    namespace: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> List[Document]:
    """
    Chunks section content for embedding.

    Optimal chunk sizes:
    - General content: 500 chars (~75-100 words) for precise retrieval
    - Summaries: 300 chars (~50 words) to keep summary context together

    Overlap: 20-25% to maintain context across chunk boundaries
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],  # Prioritize semantic breaks
        length_function=len,
    )
    chunks = splitter.split_text(section.content)

    docs = []
    for i, chunk in enumerate(chunks):
        vector_id = f"{section.id}_chunk{i}"
        docs.append(
            Document(
                page_content=chunk,
                metadata={
                    "id": vector_id,
                    "namespace": namespace,
                    "section_metadata": section.metadata,
                    "section_id": section.id,
                    "document_id": section.document_id,
                },
            )
        )

    return docs


def embed_upsert_documents(
    vectorstore: UpstashVectorStore, documents: List[Document], namespace: str
) -> None:
    ids = [doc.metadata["id"] for doc in documents]
    namespace = documents[0].metadata["namespace"]
    vectorstore.delete(ids=ids)
    vectorstore.add_documents(ids=ids, documents=documents, namespace=namespace)


# Database functions
def create_conversation(document_id: str, section_id: str) -> str:
    db_cursor.execute(
        """
        INSERT INTO conversations (document_id, section_id)
        VALUES (%s, %s)
        RETURNING thread_id
    """,
        (document_id, section_id),
    )
    thread_id = db_cursor.fetchone()[0]
    db_conn.commit()
    return thread_id


def add_message(document_id: str, thread_id: str, role: str, content: str) -> None:
    db_cursor.execute(
        """
        INSERT INTO messages (thread_id, role, content)
        VALUES (%s, %s, %s)
    """,
        (thread_id, role, content),
    )

    db_cursor.execute(
        """
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE thread_id = %s AND document_id = %s
    """,
        (thread_id, document_id),
    )
    db_conn.commit()


def update_section(section: Section) -> None:
    db_cursor.execute(
        """
        UPDATE sections
        SET title = %s, content = %s, summary = %s, metadata = %s, length = %s, num_words = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """,
        (
            section.title,
            section.content,
            section.summary,
            json.dumps(section.metadata),
            section.length,
            section.num_words,
            section.id,
        ),
    )
    db_conn.commit()


# ============================================================================
# TOOLS
# ============================================================================


@tool(
    description="Determines if the user is asking a question about their book. Returns 'yes' or 'no' and the scope."
)
def query_router(query: str) -> str:
    """
    Checks if this is a question about the book content that needs retrieval.

    Returns a simple format:
    - If question about book: "QUESTION - scope: document" or "QUESTION - scope: section"
    - If edit/generation/other: "NOT_QUESTION"
    """
    print("query_router called\n")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    routing_prompt = """Is the user asking a question about their book/document content that requires looking up information?

Examples of QUESTIONS:
- "What color are the sleeping bags?"
- "Who is the main character?"
- "What happened in chapter 3?"

Examples of NOT QUESTIONS:
- "Edit this paragraph..."
- "Make this more concise"
- "Write a new scene about..."

If it's a QUESTION, determine scope:
- "section" if asking about the current section
- "document" if asking about the whole book

User query: {query}

Respond with EXACTLY one of these formats:
- "QUESTION - scope: document"
- "QUESTION - scope: section"
- "NOT_QUESTION"

Response:"""

    response = llm.invoke(routing_prompt.format(query=query))
    result = response.content.strip()
    print(f"Query router result: {result}")

    return result


@tool(
    description="Rewrites user query to be more specific for searching. Only use if query_router said QUESTION."
)
def query_optimizer(query: str) -> str:
    """
    Rewrites the query to be more specific and search-friendly.

    Args:
        query: The original user question

    Returns: The optimized search query as a simple string
    """
    print("query_optimizer called\n")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    optimization_prompt = """Rewrite this question to be more specific and clear for semantic search. Keep it as a natural question.

Examples:
- Original: "What color are Rachel and Kate's sleeping bags?"
- Optimized: "What color are the sleeping bags that Rachel and Kate have?"

- Original: "Where did they go?"
- Optimized: "Where did the characters travel to or what location did they visit?"

Now optimize this query: {query}

Optimized query:"""

    response = llm.invoke(optimization_prompt.format(query=query))
    result = response.content.strip()
    print(f"Query optimizer result: {result}")

    return result


@tool(
    description="Searches the document using semantic similarity. Returns relevant text chunks from the book/document. Use 'section' scope for current section, 'document' for entire book."
)
def retrieve(query: str, scope: str, document_id: str, section_id: str) -> List[str]:
    """
    Performs semantic search across document content.

    Args:
        query: Optimized search query (use query_optimizer first)
        scope: "section" (current section only) or "document" (entire book)
        document_id: UUID of the document
        section_id: UUID of the current section

    Returns:
        List of relevant text chunks from the document
    """
    print(
        f"retrieve called with scope={scope}, doc={document_id}, section={section_id}\n"
    )

    # Build metadata filters for Upstash
    # Upstash uses string-based filter expressions, not dictionaries
    filter_expr = f"document_id = '{document_id}' AND section_id = '{section_id}'"

    if scope == "document":
        k_general = 10
        k_summary = 3
    elif scope == "section":
        k_general = 5
        k_summary = 1

    results = []

    # Search section summaries for high-level context (document scope only)
    print("Searching summary namespace")
    summary_docs = section_summary_vectorstore.similarity_search(
        query=query, k=k_summary, filter=filter_expr
    )
    results.extend([doc.page_content for doc in summary_docs])
    print(f"Found {len(summary_docs)} summary chunks")

    # Search detailed content chunks (always executed)
    print(f"Searching general vectorstore with filter: {filter_expr}")
    try:
        general_docs = general_vectorstore.similarity_search(
            query=query, k=k_general, filter=filter_expr
        )
        results.extend([doc.page_content for doc in general_docs])
        print(f"Found {len(general_docs)} general chunks")
    except Exception as e:
        print(f"Error searching general namespace: {e}")
        general_docs = []

    print(f"Total retrieved: {len(results)} chunks")
    print("|==============================================|")
    return results


@tool(
    description="Generates new creative content. Temperature: 0.7-0.9 for creative writing, 0.3-0.5 for factual content, 0.0-0.2 for precise edits."
)
def generate(query: str, temp: float) -> str:
    """
    Generates text using an LLM.

    Args:
        query: The generation prompt/instruction
        temp: Creativity level (0.0=deterministic, 1.0=very creative)
            - 0.0-0.2: Precise, factual, minimal variation
            - 0.3-0.5: Balanced, some creativity
            - 0.6-0.9: Creative, varied, good for fiction
            - 1.0+: Maximum randomness

    Returns:
        Generated text based on the query
    """
    print(f"generate called with temp={temp}\n")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=temp)
    response = llm.invoke(query)
    return str(response.content)


@tool(
    description="Creates a concise summary of provided text. Use for condensing sections or long content."
)
def summarize(text: str) -> str:
    """
    Summarizes text while preserving key information.

    Args:
        text: The text to summarize (can be long)

    Returns:
        A concise summary capturing main ideas and important details
    """
    print("summarize called\n")
    summarize_prompt = """Summarize the following text concisely while preserving all key information.

Guidelines:
- Capture main ideas, key events, and important details
- For narratives: Include plot points, character actions, and outcomes
- For technical text: Preserve core concepts and conclusions
- Be clear and brief
- Do not add opinions or information not in the original text

Text to summarize:
{text}

Summary:"""

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    response = llm.invoke(summarize_prompt.format(text=text))

    return str(response.content)


@tool(description="Stores important user details into long-term memory")
def store_ltm(text: str, document_id: str, thread_id: str) -> str:
    """Store a memory for a specific user and conversation thread. For long-term memory."""
    print("store_ltm called\n")
    memory_vectorstore.add_texts(
        [text], metadatas={"document_id": document_id, "thread_id": thread_id}
    )
    return "Memory stored successfully."


@tool(
    description="Recalls relevant memories for a user and thread from long-term memory"
)
def recall_ltm(query: str, document_id: str, thread_id: str) -> list[str]:
    """Retrieve relevant memories for a specific user and thread. For long-term memory."""
    print("recall_ltm called\n")
    results = memory_vectorstore.similarity_search(
        query, k=3, filter={"document_id": document_id, "thread_id": thread_id}
    )
    return [r.page_content for r in results]


# ============================================================================
# AGENT
# ============================================================================

checkpointer = PostgresSaver(db_conn)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4)
tools = [
    query_router,
    query_optimizer,
    retrieve,
    generate,
    summarize,
    store_ltm,
    recall_ltm,
]
prompt = """You are an AI Writing Assistant for authors. You help with editing and answering questions about their manuscript.

## WORKFLOW FOR QUESTIONS

If the user asks a question about their book:

1. Call `query_router(user_query)` once
   - If result contains "QUESTION", continue to step 2
   - If result is "NOT_QUESTION", just answer directly

2. Call `query_optimizer(user_query)` once to get a better search query

3. Call `retrieve(optimized_query, scope, document_id, section_id)` once
   - Use the optimized query from step 2
   - Extract scope from query_router result (either "document" or "section")
   - Get document_id and section_id from the [CONTEXT] line (format: document_id="...", section_id="...")

4. Answer using ONLY the text from retrieve. If the answer isn't there, say "I don't have that information."

## FOR EDITING AND OTHER TASKS

- **Editing text**: Just provide improvements directly. You can use retrieve if you need context from other parts.
- **Writing new content**: Use `generate(prompt, temperature)`
- **Summarizing**: Use `summarize(text)`

## RULES
- Call each tool only ONCE per workflow
- Never make up information about the book
- Be concise and helpful"""


def create_prompt(state):
    return [{"role": "system", "content": prompt}] + state["messages"]


def create_agent():
    return create_react_agent(
        model=llm, tools=tools, prompt=create_prompt, checkpointer=checkpointer
    )


# ============================================================================
# SERVER
# ============================================================================


def handle_message(
    document_id: str, section_id: str, thread_id: str | None, content: str
):
    if thread_id is None:
        thread_id = create_conversation(document_id, section_id)
    add_message(document_id, thread_id, "user", content)

    # Inject document and section context into the user message
    # so the agent can pass them to the retrieve tool
    context_aware_content = f"""[CONTEXT: document_id="{document_id}", section_id="{section_id}"]

User query: {content}"""

    agent = create_agent()
    inputs = {"messages": [("user", context_aware_content)]}
    response = agent.invoke(
        input=inputs, config={"configurable": {"thread_id": thread_id}}
    )

    add_message(document_id, thread_id, "assistant", response["messages"][-1].content)

    return thread_id, response["messages"][-1].content


def handle_save(section: Section) -> None:
    # Chunk, embed and upsert section
    section_docs = get_docs(section=section, namespace="general")
    print(f"Section docs chunked: {len(section_docs)}")

    if len(section_docs) > 0:
        print(section_docs[0])
        embed_upsert_documents(
            vectorstore=general_vectorstore, documents=section_docs, namespace="general"
        )
        print("Documents embedded and upserted")

    # Get new section summary, chunk, embed and upsert if the section has more than 100 words
    if section.num_words > 100:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        summary_prompt = f"Summarize the following section of a document in four sentences:\n\n{section.content}"
        new_summary = llm.invoke(summary_prompt).content
        print(f"Summary generated")

        # Update section on Postgres
        section.summary = new_summary
        print(f"Section updated: {section.id}")

        summary_docs = get_docs(
            section=section, namespace="summary", chunk_size=300, chunk_overlap=50
        )
        print(f"Summary docs chunked: {len(summary_docs)}")

        if len(summary_docs) > 0:
            embed_upsert_documents(
                vectorstore=section_summary_vectorstore,
                documents=summary_docs,
                namespace="summary",
            )

    # Update section on Postgres
    update_section(section)


@app.route("/message", methods=["POST"])
def message():
    try:
        print("=== /message endpoint called ===")
        print(f"Request JSON: {request.json}")

        document_id = request.json["document_id"]
        print(f"document_id: {document_id}")

        section_id = request.json["section_id"]
        print(f"section_id: {section_id}")

        thread_id = request.json.get("thread_id")
        print(f"thread_id: {thread_id}")

        content = request.json["content"]
        print(f"content: {content}")

        # Handle user message
        thread_id, content = handle_message(document_id, section_id, thread_id, content)

        response_data = {
            "document_id": document_id,
            "thread_id": thread_id,
            "role": "assistant",
            "content": content,
        }
        print(f"Response: {response_data}")

        return jsonify(response_data)
    except Exception as e:
        print(f"ERROR in /message endpoint: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/save", methods=["POST"])
def embed():
    try:
        section = Section(
            title=request.json["title"],
            document_id=request.json["document_id"],
            content=request.json["content"],
            summary=request.json["summary"],
            metadata=request.json["metadata"],
            length=request.json["length"],
            num_words=request.json["num_words"],
            id=request.json["id"],
        )

        handle_save(section)
        return jsonify({"status": "success"})
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": str(e)})


if __name__ == "__main__":
    app.run(debug=True, port=5001)

    # document_id = "c4db96ea-52e8-4a85-a028-02551ee90618"
    # thread_id = "231d02eb-d49b-4b4d-9091-781d424d2143 "
    # thread_id = None

    # message = "What medication is Emma on?"
    # message = """
    #     Edit this:

    #     They chatted until the period ended. Emma said her goodbyes to Julian and Ms. Shafer, carrying her card out in a smaller
    #     painting folder so ensure it didn’t get damaged. Henry and Emma walked down the halls until they had to split up for
    #     their final class. Both of them had a sense of levity as the day they had dreaded for weeks was almost over and
    #     went fairly well all things considered.
    # """

    # thread_id, answer = handle_message(document_id, thread_id, message)
    # print(f"Thread ID: {thread_id} \nAnswer: {answer}")

    # db_cursor.close()
    # db_conn.close()
