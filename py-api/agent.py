from dotenv import load_dotenv
from langchain_core.tools import tool
from rag_pipeline import rag_pipeline
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

load_dotenv()

@tool
def call_rag(question: str):
    """This is a RAG function that can be used to get information about the book or document"""
    return rag_pipeline(question)

tools = [call_rag]

llm = ChatOpenAI(model ="gpt-4o-mini")

prompt = '''
You are a Writing Assistant AI with two main functions:\n\n1. Editing Writing: Focus on grammar, clarity, 
conciseness, and readability. For creative text (fiction, storytelling, dialogue), you may make light creative 
improvements while preserving tone and meaning.\n\n2. Answering Questions About Written Content: Use the RAG 
pipeline documents to answer questions factually. If you need information to answer a question, call the 
`call_rag` tool. If the content does not support an answer, respond with \"I don’t know.\" Never invent 
information.\n\nGeneral Rules: All responses must pertain to the writing. Maintain accuracy and helpfulness. If 
a request is unclear, ask clarifying questions instead of guessing. End each conversation asking: Anything else 
I can help with?"
'''

def create_prompt(state):
    return [{"role": "system", "content": prompt}] + state['messages']

agent = create_react_agent(
    model=llm,
    tools=tools,
    prompt=create_prompt
)

def print_stream(stream):
    for s in stream:
        message = s["messages"][-1]
        if isinstance(message, tuple):
            print(message)
        else:
            message.pretty_print()

inputs = {"messages": [("user", "How many medications are Emma on?")]}
# print_stream(app.stream(inputs, stream_mode="values"))
result = agent.invoke(input=inputs)
print(result["messages"][-1].content)