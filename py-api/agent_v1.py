import psycopg

# from pydantic import BaseModel
from dotenv import load_dotenv
from langchain.tools import tool
from typing import List, Dict, Any
from langchain_chroma import Chroma
from langchain.load import dumps, loads
from langchain_core.documents import Document
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores.upstash import UpstashVectorStore

load_dotenv()


# ============================================================================
# CORE COMPONENTS
# ============================================================================
db_conn = psycopg.connect(
    dbname="scribo", user="postgres", password="root", host="localhost", port="5432"
)
db_cursor = db_conn.cursor()
embeddings = OpenAIEmbeddings()
memory_vectorstore = Chroma(
    persist_directory="./chromadb", embedding_function=embeddings
)
document_vectorstore = UpstashVectorStore(namespace="raptor_rag", embedding=embeddings)
# document_vectorstore = UpstashVectorStore(namespace="general", embedding=embeddings)
# section_summary_vectorstore = UpstashVectorStore(
#     namespace="summary", embedding=embeddings
# )


# class QueryRouterOutput(BaseModel):
#     intent: str
#     scope: str
#     requires_context: bool


# class QueryOptimizedOutput(BaseModel):
#     optimized_query: str
#     sub_queries: List[str]
#     entities: List[str]
#     filters: Dict[str, Any]


class Store:
    """Handles Postgres operations"""

    def __init__(self, db_conn, db_cursor):
        self.db_conn = db_conn
        self.db_cursor = db_cursor

    def update_section(self, section_id: str, content: str):
        """Updates a section in Postgres"""

    def get_section_summary(self, section_id: str) -> str:
        """Gets a section summary from Postgres"""

    def store_section_summary(self, section_id: str, summary: str):
        """Stores a section summary in Postgres"""

    def create_conversation(self, document_id: str) -> str:
        """Create a new conversation thread in DB and return thread_id"""
        self.db_cursor.execute(
            """
            INSERT INTO conversations (document_id)
            VALUES (%s)
            RETURNING thread_id
        """,
            (document_id,),
        )
        thread_id = self.db_cursor.fetchone()[0]
        self.db_conn.commit()
        return thread_id

    def add_message(
        self, document_id: str, thread_id: str, role: str, content: str
    ) -> None:
        """Add a message to a conversation thread in DB"""
        self.db_cursor.execute(
            """
            INSERT INTO messages (thread_id, role, content)
            VALUES (%s, %s, %s)
        """,
            (thread_id, role, content),
        )

        self.db_cursor.execute(
            """
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE thread_id = %s AND document_id = %s
        """,
            (thread_id, document_id),
        )
        self.db_conn.commit()


def reciprocal_rank_fusion(results: list[list], k=60) -> list[tuple]:
    """Reciprocal_rank_fusion that takes multiple lists of ranked documents
    and an optional parameter k used in the RRF formula"""
    # Initialize a dictionary to hold fused scores for each unique document
    fused_scores = {}
    # Iterate through each list of ranked documents
    for docs in results:
        # Iterate through each document in the list, with its rank (position in the list)
        for rank, doc in enumerate(docs):
            # Convert the document to a string format to use as a key (assumes documents can be serialized to JSON)
            doc_str = dumps(doc)
            # If the document is not yet in the fused_scores dictionary, add it with an initial score of 0
            if doc_str not in fused_scores:
                fused_scores[doc_str] = 0
            # Retrieve the current score of the document, if any
            previous_score = fused_scores[doc_str]
            # Update the score of the document using the RRF formula: 1 / (rank + k)
            fused_scores[doc_str] += 1 / (rank + k)

    # Sort the documents based on their fused scores in descending order to get the final reranked results
    reranked_results = [
        (loads(doc), score)
        for doc, score in sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
    ]

    # Return the reranked results as a list of tuples, each containing the document and its fused score
    return reranked_results


def call_reciprocal_rank_fusion(query: str, k=3):
    """Generates k queries and calls reciprocal_rank_fusion on them"""

    template = """You are an AI language model assistant. Your task is to generate three
    different versions of the given user question to retrieve relevant documents from a vector
    database. By generating multiple perspectives on the user question, your goal is to help
    the user overcome some of the limitations of the distance-based similarity search.
    Provide these alternative questions separated by newlines. Original question: {question} \n
    Output (3 queries):"""
    prompt_rag_fusion = ChatPromptTemplate.from_template(template)

    document_retriever = document_vectorstore.as_retriever(
        search_type="similarity", search_kwargs={"k": k}
    )

    generate_queries = (
        prompt_rag_fusion
        | ChatOpenAI(model="gpt-4o-mini", temperature=0)
        | StrOutputParser()
        | (lambda x: x.split("\n"))
    )

    rag_fusion_retrieval_chain = (
        generate_queries | document_retriever.map() | reciprocal_rank_fusion
    )

    result = rag_fusion_retrieval_chain.invoke(query)

    print(type(result))

    print(result[0])
    for i in range(len(result)):
        print(f"Score #{i + 1}: {result[i][1]}\n")
        print("-----")


# ============================================================================
# TOOLS
# ============================================================================


@tool(
    description="Classifies user intent, the scope of the request, and if document context is needed"
)
def query_router(query: str) -> str:
    """
    LLM Call: "What is the user trying to do?"

    Returns:
    {
        intent: "edit" | "question" | "generate" | "summarize",
        scope: "section" | "document" | "global",
    }
    """
    print("query_router called\n")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)
    # structured_llm = llm.with_structured_output(schema=QueryRouterOutput)

    routing_prompt = """You are a query classifier for a writing assistant.
    Analyze the user's query and return a JSON object with the following fields:
    - intent: one of ["edit", "question", "generate", "summarize"]
    - scope: one of ["section", "document", "global"]

    Intent definitions:
    - edit: User wants to modify existing text
    - question: User asks a question about content
    - generate: User wants new content created
    - summarize: User wants a summary of content

    Scope definitions:
    - section: Query targets a specific section
    - document: Query targets the entire document
    - global: Query is about general knowledge or writing advice

    User query: {query}

    """

    # response = structured_llm.invoke(routing_prompt.format(query=query))

    response = llm.invoke(routing_prompt.format(query=query))
    # result = json.loads(response)

    return str(response.content)


@tool(description="Optimizes and decomposes queries for better retrieval")
def query_optimizer(query: str, scope: str) -> str:
    """
    LLM Call: "Rewrite this query to be more specific"

    Returns:
    {
        optimized_query: "clearer version",
        sub_queries: ["query1", "query2"],
        entities: ["Alice", "Chapter 3"],
        filters: {chapter: 3, character: "Alice"}
    }
    """
    print("query_optimizer called\n")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)
    # structured_llm = llm.with_structured_output(schema=QueryOptimizedOutput)

    optimization_prompt = """You are a query optimizer for a writing assistant.
    Given the user's query and the scope, rewrite the query to be more specific
    and decompose it into sub-queries if needed. Also extract any entities and
    suggest filters for retrieval.

    Scope definitions:
    - section: Query targets a specific section
    - document: Query targets the entire document
    - global: Query is about general knowledge or writing advice

    User query: {query}
    Scope: {scope}

    Return a JSON object with:
    - optimized_query: a clearer version of the query
    - sub_queries: a list of sub-queries if decomposition is needed, else empty list
    - entities: a list of key entities mentioned in the query
    - filters: a dictionary of suggested filters for retrieval

    Return ONLY a valid JSON object."""

    # response = structured_llm.invoke(
    #     optimization_prompt.format(query=query, scope=scope)
    # )

    response = llm.invoke(optimization_prompt.format(query=query, scope=scope))
    # result = json.loads(response.content)

    return str(response.content)


@tool(
    description="Retrieves relevant document and section summary chunks based on query and scope"
)
def retrieve(query: str, scope: str) -> List[str]:
    print("retrieve called\n")
    if scope == "section":
        k = 3
    elif scope == "document" or scope == "global":
        k = 5

    k = k or 4

    def docs_to_string(docs: List[Document]) -> List[str]:
        return [doc.page_content for doc in docs]

    docs = document_vectorstore.similarity_search(query=query, k=k)

    # if k == 5:
    #     sections = section_summary_vectorstore.similarity_search(
    #         query=query, k=3, filters=filters
    #     )
    #     docs = sections + docs

    return docs_to_string(docs)


@tool(description="Calls an llm based on a query and a temperature.")
def generate(query: str, temp: float) -> str:
    print("generate called\n")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=temp)
    response = llm.invoke(query)
    return str(response.content)


@tool(description="Summarizes input text")
def summarize(text: str) -> str:
    print("summarize called\n")
    summarize_prompt = """You are a helpful assistant that specializes in summarizing text.

    Your task is to read the provided text and generate a concise, accurate summary that captures the main ideas and important details.
    - Focus on clarity and brevity.
    - Do not include personal opinions or information not present in the original text.
    - If the text is technical or complex, simplify it while preserving the core meaning.
    - If the text is a narrative, capture the key events and themes.

    Return only the summary, without any additional commentary or formatting.

    {text}
    """

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
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
prompt = """
You are a Writing Assistant AI equipped with specialized tools to help users with writing, answering questions, and managing memory. You can reason through multi-step tasks and use your tools in sequence to solve complex queries.

Your main functions and available tools are:

1. **Editing Writing:** Focus on grammar, clarity, conciseness, and readability. For creative text (fiction, storytelling, dialogue), you may make light creative improvements while preserving tone and meaning.
    - Please add details from the book using the `retrieve` tool if necessary
    - Verify specific details from the rest of the book when you are asked using the `retrieve` tool

2. **Answering Questions About Written Content (RAG):**
   - To answer questions factually, use the Retrieval-Augmented Generation (RAG) workflow:
     - First, use the `query_router` tool to classify the user's intent, scope, and whether document context is needed.
     - Next, use the `query_optimizer` tool to rewrite the query for specificity, decompose it, extract entities, and suggest filters.
     - Then, use the `retrieve` tool with the optimized query, scope, and filters to fetch relevant document or section chunks.
     - Use the retrieved content to answer the user's question. If the content does not support an answer, respond with "I don’t know." Never invent information.

3. **Content Generation:** Use the `generate` tool to create new content or responses based on a query and a specified creativity level (temperature).

4. **Summarization:** Use the `summarize` tool to produce concise, accurate summaries of provided text.

5. **Long-Term Memory:**
   - Use the `store_ltm` tool to save important user details or memories into long-term memory.
   - Use the `recall_ltm` tool to fetch relevant memories for a user and conversation thread.

**General Rules:**
- You may need to use multiple tools in sequence to answer a query or solve a task.
- Always call query_router before using other tools.
- All responses must pertain to the writing, content, or memory context.
- Maintain accuracy and helpfulness.
- If you editing a scene and think adding something from the book would help, generate a prompt for the retrieval tool.
- If a request is unclear, ask clarifying questions instead of guessing.
- Never invent information.
- End each conversation by asking: "Anything else I can help with?"

**Available tools:**
- `query_router`
- `query_optimizer`
- `retrieve`
- `generate`
- `summarize`
- `store_ltm`
- `recall_ltm`
"""


def create_prompt(state):
    return [{"role": "system", "content": prompt}] + state["messages"]


def create_agent():
    return create_react_agent(
        model=llm, tools=tools, prompt=create_prompt, checkpointer=checkpointer
    )


def handle_message(document_id: str, thread_id: str | None, message: str):
    store = Store(db_conn=db_conn, db_cursor=db_cursor)
    if thread_id is None:
        thread_id = store.create_conversation(document_id)
    store.add_message(document_id, thread_id, "user", message)

    agent = create_agent()
    inputs = {"messages": [("user", message)]}
    response = agent.invoke(
        input=inputs, config={"configurable": {"thread_id": thread_id}}
    )
    for message in response["messages"]:
        print(message)
        print("|=========================|")

    store.add_message(
        document_id, thread_id, "assistant", response["messages"][-1].content
    )

    return thread_id, response["messages"][-1].content


if __name__ == "__main__":
    document_id = "c4db96ea-52e8-4a85-a028-02551ee90618"
    # thread_id = "231d02eb-d49b-4b4d-9091-781d424d2143"
    thread_id = None
    message = "What medication is Emma on?"
    # message = """
    #     Edit this:

    #     They chatted until the period ended. Emma said her goodbyes to Julian and Ms. Shafer, carrying her card out in a smaller
    #     painting folder so ensure it didn’t get damaged. Henry and Emma walked down the halls until they had to split up for
    #     their final class. Both of them had a sense of levity as the day they had dreaded for weeks was almost over and
    #     went fairly well all things considered.
    # """

    thread_id, answer = handle_message(document_id, thread_id, message)
    print(f"Thread ID: {thread_id} \nAnswer: {answer}")

    db_cursor.close()
    db_conn.close()
