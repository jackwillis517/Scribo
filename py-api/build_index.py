from raptor import raptor
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores.upstash import UpstashVectorStore 
from langchain.text_splitter import RecursiveCharacterTextSplitter

load_dotenv()

def build_index(pdf_path: str) -> None:
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)

    embeddings = OpenAIEmbeddings()

    vectorstore = UpstashVectorStore(
        namespace="raptor_rag",
        embedding=embeddings,
    )

    # RAPTOR summarization (expensive, do this once)
    leaf_texts = splits
    raptor_results = raptor(leaf_texts, level=1, n_levels=3)

    all_texts = leaf_texts.copy()
    all_text_strs = [doc.page_content for doc in all_texts]

    for level in sorted(raptor_results.keys()):
        summaries = raptor_results[level][1]["summaries"].tolist()
        all_text_strs.extend(summaries)

    vectorstore.add_texts(texts=all_text_strs, namespace="raptor_rag")
    
    # Persist vectorstore to disk (so you don’t rebuild every query)
    # vectorstore = Chroma.from_texts(
    #     texts=all_text_strs, 
    #     embedding=OpenAIEmbeddings(),
    #     persist_directory=persist_dir
    # )