import re
import numpy as np
from typing import List, Dict, Any

class VectorStore:
    """Lightweight vector store for document indexing and chunk retrieval."""
    
    def __init__(self, chunk_size: int = 300, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.chunks: List[Dict[str, Any]] = []

    def chunk_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Split a document into overlapping text chunks with metadata."""
        content = doc.get("content", "")
        title = doc.get("title", doc.get("filename", "Unknown Document"))
        doc_id = doc.get("id", "doc-0")
        version = doc.get("version", "1.0")
        category = doc.get("category", "General")
        
        words = content.split()
        chunks = []
        
        step = max(1, self.chunk_size - self.overlap)
        for i in range(0, len(words), step):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = " ".join(chunk_words)
            if len(chunk_text.strip()) > 10:
                chunks.append({
                    "chunk_id": f"{doc_id}_chunk_{len(chunks)}",
                    "doc_id": doc_id,
                    "doc_title": title,
                    "version": version,
                    "category": category,
                    "text": chunk_text
                })
        return chunks

    def add_documents(self, documents: List[Dict[str, Any]]):
        """Index all provided documents."""
        self.chunks = []
        for doc in documents:
            doc_chunks = self.chunk_document(doc)
            self.chunks.extend(doc_chunks)

    def _get_query_tokens(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\w+', text) if len(w) > 2]

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Search chunks using TF-IDF / term overlap cosine ranking with recency scoring."""
        if not self.chunks:
            return []
            
        q_tokens = self._get_query_tokens(query)
        if not q_tokens:
            return self.chunks[:top_k]
            
        scores = []
        for idx, chunk in enumerate(self.chunks):
            text_tokens = self._get_query_tokens(chunk["text"])
            doc_title_tokens = self._get_query_tokens(chunk["doc_title"])
            
            # Count term matches
            matches = sum(1 for token in q_tokens if token in text_tokens)
            title_matches = sum(1 for token in q_tokens if token in doc_title_tokens)
            
            # Basic BM25-like / term frequency score
            score = (matches * 1.0) + (title_matches * 1.5)
            
            # Normalize by document length square root
            if text_tokens:
                score = score / (np.sqrt(len(text_tokens)) + 1.0)
                
            scores.append((score, idx))

        # Sort by relevance score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        
        results = []
        for score, idx in scores[:top_k]:
            item = dict(self.chunks[idx])
            item["score"] = float(score)
            results.append(item)
            
        return results
