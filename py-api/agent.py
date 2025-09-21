import psycopg 
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.tools import tool
from rag_pipeline import rag_pipeline
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

load_dotenv()

# Database connection
db_conn = psycopg.connect(dbname="scribo", user="postgres", password="root", host="localhost", port="5432")
db_cursor = db_conn.cursor()

# Functions to track conversation messages for UI
def create_conversation(user_id: str) -> str:
    db_cursor.execute("""
        INSERT INTO conversations (user_id)
        VALUES (%s)
        RETURNING thread_id
    """, (user_id,))
    thread_id = db_cursor.fetchone()[0]
    db_conn.commit()
    return thread_id

def add_message(user_id: str, thread_id: str, role: str, content: str) -> None:
    db_cursor.execute("""
        INSERT INTO messages (user_id, thread_id, role, content)
        VALUES (%s, %s, %s, %s)
    """, (user_id, thread_id, role, content))

    db_cursor.execute("""
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE thread_id = %s AND user_id = %s
    """, (thread_id, user_id))
    db_conn.commit()

# Checkpointer for STM (short term memory)
checkpointer = PostgresSaver(db_conn)
# db_conn.autocommit = True 
# checkpointer.setup()
# db_conn.autocommit = False 

# Chroma for LTM (long term memory)
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(
    persist_directory="./chromadb",  # optional: saves vectors to disk
    embedding_function=embeddings
)

# Tools 
@tool
def store_memory(text: str, user_id: str, thread_id: str) -> str:
    """Store a memory for a specific user and conversation thread. For long-term memory."""
    vectorstore.add_texts([text], metadatas={"user_id": user_id, "thread_id": thread_id})
    return "Memory stored successfully."

@tool
def recall_memory(query: str, user_id: str, thread_id: str) -> list[str]:
    """Retrieve relevant memories for a specific user and thread. For long-term memory."""
    results = vectorstore.similarity_search(query, k=3, filter={"user_id": user_id, "thread_id": thread_id})
    return [r.page_content for r in results]

@tool
def call_rag(question: str) -> str:
    """This is a RAG function that can be used to get information about the book or document."""
    return rag_pipeline(question)

tools = [call_rag, store_memory, recall_memory]

llm = ChatOpenAI(model ="gpt-4o-mini")

prompt = """
You are a Writing Assistant AI with three main functions:

1. Editing Writing: Focus on grammar, clarity, conciseness, and readability. 
   For creative text (fiction, storytelling, dialogue), you may make light creative 
   improvements while preserving tone and meaning.

2. Answering Questions About Written Content: Use the RAG pipeline documents to answer 
   questions factually. If you need information to answer a question, call the `call_rag` tool. 
   If the content does not support an answer, respond with "I don’t know." Never invent information.

3. Memory: Use the `store_memory` tool to save important user details into long-term memory, 
   and the `recall_memory` tool to fetch them later.

General Rules: 
- All responses must pertain to the writing or memory context.
- Maintain accuracy and helpfulness. 
- If a request is unclear, ask clarifying questions instead of guessing.
- End each conversation asking: "Anything else I can help with?"
"""

def create_prompt(state):
    return [{"role": "system", "content": prompt}] + state['messages']

def create_agent():
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=create_prompt,
        checkpointer=checkpointer
    )

def handle_message(user_id: str, thread_id: str | None, message: str):
    if thread_id is None:
        thread_id = create_conversation(user_id)

    add_message(user_id, thread_id, "user", message)

    agent = create_agent()
    inputs = {"messages": [("user", message)]}
    response = agent.invoke(input=inputs, config= {"configurable": {"thread_id": thread_id}})

    add_message(user_id, thread_id, "assistant", response["messages"][-1].content)

    return response, thread_id, response["messages"][-1].content


if __name__ == "__main__":
    user_id = "0aac3043-9542-41ec-bc8d-9e0ebe9f614e"  
    thread_id = "236956e6-2c36-49d6-916c-5b23dd3ba45a"
    # thread_id = None  
    message = "What question did I just ask?"

    result, thread_id, answer = handle_message(user_id, thread_id, message)
    print(f"Full Response: {result}\n\n\n")
    print(f"Thread ID: {thread_id} \nAnswer: {answer}")

    db_cursor.close()
    db_conn.close()


# def print_stream(stream):
#     for s in stream:
#         message = s["messages"][-1]
#         if isinstance(message, tuple):
#             print(message)
#         else:
#             message.pretty_print()

# inputs = {"messages": [("user", "How many medications are Emma on?")]}
# print_stream(app.stream(inputs, stream_mode="values"))
# result = agent.invoke(input=inputs)
# print(result["messages"][-1].content)

