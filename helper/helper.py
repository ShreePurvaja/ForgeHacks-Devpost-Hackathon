from typing import List
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()


def load_pdf_files(data):
    from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
    loader = DirectoryLoader(
        data,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )
    documents = loader.load()
    return documents


def filter_to_minimal_docs(docs: List[Document]) -> List[Document]:
    """
    Keep only page_content and source metadata
    """
    return [
        Document(
            page_content=doc.page_content,
            metadata={"source": doc.metadata.get("source")}
        )
        for doc in docs
    ]


def download_embeddings():
    """
    Load embedding model (384 dimension) safely with fallback
    """
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="BAAI/bge-small-en-v1.5",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )
        return embeddings
    except Exception as e:
        print(f"⚠️ HuggingFaceEmbeddings unavailable ({e}). Using FakeEmbeddings fallback.")
        from langchain_core.embeddings import FakeEmbeddings
        return FakeEmbeddings(size=384)


def text_split(minimal_docs):
    """
    Split documents into chunks
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=20
    )

    texts_chunk = text_splitter.split_documents(minimal_docs)

    return texts_chunk