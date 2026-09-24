"""
Hybrid Retrieval Engine (BM25 + TF-IDF Vectorizer with Reciprocal Rank Fusion).
Implements F4 from PRD:
"Run BM25 and embeddings/vectorizer, then rerank, and retrieve the top-k policy chunks per clause."
"""

import re
from typing import List, Tuple, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi

from app.services.chunker import PolicyChunk


def tokenize_text(text: str) -> List[str]:
    """Simple lowercase word tokenizer for BM25."""
    return [w.lower() for w in re.findall(r"\b\w{2,}\b", text)]


class PolicyRetriever:
    def __init__(self, chunks: List[PolicyChunk]):
        self.chunks = chunks
        self.bm25: BM25Okapi = None
        self.vectorizer: TfidfVectorizer = None
        self.tfidf_matrix = None
        self._build_index()

    def _build_index(self):
        if not self.chunks:
            return

        corpus = [f"{c.section} {c.text}" for c in self.chunks]

        # 1. BM25 Index
        tokenized_corpus = [tokenize_text(doc) for doc in corpus]
        self.bm25 = BM25Okapi(tokenized_corpus)

        # 2. Dense/Sublinear TF-IDF n-gram (1-3) Vectorizer
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            stop_words="english",
            token_pattern=r"(?u)\b\w+\b"
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        min_threshold: float = 0.08
    ) -> List[Tuple[PolicyChunk, float]]:
        """
        Hybrid retrieval combining BM25 and TF-IDF with Reciprocal Rank Fusion (RRF) and reranking.
        Returns top_k (PolicyChunk, fused_score).
        """
        if not self.chunks or self.bm25 is None or self.tfidf_matrix is None:
            return []

        num_docs = len(self.chunks)

        # 1. BM25 Scores
        query_tokens = tokenize_text(query)
        bm25_scores = np.array(self.bm25.get_scores(query_tokens)) if query_tokens else np.zeros(num_docs)
        if bm25_scores.max() > 0:
            norm_bm25 = bm25_scores / (bm25_scores.max() + 1e-9)
        else:
            norm_bm25 = bm25_scores

        # 2. Vector Cosine Similarity
        query_vec = self.vectorizer.transform([query])
        tfidf_sim = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # 3. Reciprocal Rank Fusion (RRF)
        # RRF Score = 1 / (60 + rank_bm25) + 1 / (60 + rank_tfidf)
        rrf_k = 60
        bm25_ranking = np.argsort(bm25_scores)[::-1]
        tfidf_ranking = np.argsort(tfidf_sim)[::-1]

        bm25_rank_map = {idx: rank + 1 for rank, idx in enumerate(bm25_ranking)}
        tfidf_rank_map = {idx: rank + 1 for rank, idx in enumerate(tfidf_ranking)}

        fused_scores = np.zeros(num_docs)
        for idx in range(num_docs):
            r_bm25 = bm25_rank_map[idx]
            r_tfidf = tfidf_rank_map[idx]
            rrf_score = (1.0 / (rrf_k + r_bm25)) + (1.0 / (rrf_k + r_tfidf))
            # Hybrid blend: 50% RRF rank weight + 25% BM25 magnitude + 25% Vector similarity
            weighted_score = (rrf_score * 30.0) + (0.35 * norm_bm25[idx]) + (0.35 * tfidf_sim[idx])
            fused_scores[idx] = weighted_score

        # 4. Rerank descending
        ranked_indices = np.argsort(fused_scores)[::-1]

        results: List[Tuple[PolicyChunk, float]] = []
        for idx in ranked_indices:
            score = float(fused_scores[idx])
            # If both BM25 and TFIDF were virtually 0, skip
            if tfidf_sim[idx] < min_threshold and norm_bm25[idx] < 0.15:
                continue
            results.append((self.chunks[idx], round(score, 4)))
            if len(results) >= top_k:
                break

        return results
