"""
Citation Verification & Anti-Hallucination Guard Service.
Guarantees that every cited policy snippet exists verbatim in the ingested source documents.
Calculates exact character span offsets and multi-line bounding box coordinates for visual highlighting.

Implements strict verification logic:
1. Exact match -> VERIFIED (verified=True, similarity=1.0)
2. Whitespace-normalized match -> VERIFIED (verified=True, similarity=1.0)
3. Fuzzy similarity match -> SIMILARITY_MATCH (verified=False, similarity=score)
   - Fuzzy matches NEVER enter the verified evidence path!
4. No match / Empty / Wrong page / Wrong document -> NOT_FOUND (verified=False, similarity=0.0)
"""

import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher

from app.services.pdf_parser import DocumentPage, search_phrase_bboxes
from app.models.schemas import PolicyEvidence, Citation, VerificationStatus


class CitationVerifier:
    def __init__(self, raw_pages_by_doc: Dict[str, List[DocumentPage]]):
        """
        raw_pages_by_doc maps document_id (or document_name) -> List[DocumentPage]
        """
        self.raw_pages_by_doc = raw_pages_by_doc

    def verify_evidence(
        self,
        document_id: str,
        document_name: str,
        page_number: int,
        section: Optional[str],
        cited_text: str,
        chunk_id: Optional[str] = None,
        document_version: Optional[str] = "1.0"
    ) -> PolicyEvidence:
        """
        Cross-checks cited_text against the actual text of page_number in document_id.
        Computes highlight offsets, multi-line bounding boxes, and verification status.
        Only exact or whitespace-normalized matches are marked as VERIFIED.
        Fuzzy matches are classified as SIMILARITY_MATCH with verified=False.
        """
        # Step 1: Empty citation check
        if not cited_text or not cited_text.strip():
            return PolicyEvidence(
                document_id=document_id,
                document=document_name,
                page=page_number,
                section=section,
                text="",
                highlight_start=None,
                highlight_end=None,
                bboxes=[],
                document_version=document_version,
                citation=Citation(
                    verified=False,
                    status=VerificationStatus.NOT_FOUND,
                    similarity_score=0.0,
                    note="Citation verification failed: empty citation text provided."
                )
            )

        # Step 2: Document resolution
        pages = self.raw_pages_by_doc.get(document_id) or self.raw_pages_by_doc.get(document_name, [])
        if not pages:
            # Search in any document with matching name
            for k, p_list in self.raw_pages_by_doc.items():
                if p_list and (p_list[0].document_name == document_name or document_name in p_list[0].document_name):
                    pages = p_list
                    break

        if not pages:
            return PolicyEvidence(
                document_id=document_id,
                document=document_name,
                page=page_number,
                section=section,
                text=cited_text,
                highlight_start=None,
                highlight_end=None,
                bboxes=[],
                document_version=document_version,
                citation=Citation(
                    verified=False,
                    status=VerificationStatus.NOT_FOUND,
                    similarity_score=0.0,
                    note=f"Citation verification failed: document '{document_name}' not found in ingested documents."
                )
            )

        # Step 3: Exact page resolution (strict: do not fall back to other pages)
        target_page = next((p for p in pages if p.page_number == page_number), None)
        if not target_page:
            return PolicyEvidence(
                document_id=document_id,
                document=document_name,
                page=page_number,
                section=section,
                text=cited_text,
                highlight_start=None,
                highlight_end=None,
                bboxes=[],
                document_version=document_version,
                citation=Citation(
                    verified=False,
                    status=VerificationStatus.NOT_FOUND,
                    similarity_score=0.0,
                    note=f"Citation verification failed: page {page_number} not found in document '{document_name}'."
                )
            )

        page_str = target_page.text
        file_path = Path(target_page.file_path) if target_page.file_path else None

        # Step 4: Pass 1 - Exact substring match
        start_idx = page_str.find(cited_text)
        if start_idx != -1:
            bboxes, pw, ph = [], target_page.width, target_page.height
            if file_path and file_path.exists():
                bboxes, pw, ph = search_phrase_bboxes(file_path, page_number, cited_text)

            return PolicyEvidence(
                document_id=document_id,
                document=document_name,
                page=page_number,
                section=section,
                text=cited_text,
                highlight_start=start_idx,
                highlight_end=start_idx + len(cited_text),
                bboxes=bboxes,
                page_width=pw,
                page_height=ph,
                document_version=document_version,
                citation=Citation(
                    verified=True,
                    status=VerificationStatus.VERIFIED,
                    similarity_score=1.0,
                    note=f"Exact match verified in code (offsets {start_idx}–{start_idx + len(cited_text)})."
                )
            )

        # Step 5: Pass 2 - Whitespace-normalized exact match
        norm_page = " ".join(page_str.split())
        norm_cite = " ".join(cited_text.split())
        norm_idx = norm_page.find(norm_cite)

        if norm_idx != -1:
            # Map back to original page string character coordinates
            first_segment = norm_cite[:min(35, len(norm_cite))]
            approx_start = max(0, page_str.find(first_segment))
            approx_end = approx_start + len(cited_text) if approx_start != -1 else norm_idx + len(norm_cite)

            bboxes, pw, ph = [], target_page.width, target_page.height
            if file_path and file_path.exists():
                bboxes, pw, ph = search_phrase_bboxes(file_path, page_number, cited_text)

            return PolicyEvidence(
                document_id=document_id,
                document=document_name,
                page=page_number,
                section=section,
                text=cited_text,
                highlight_start=approx_start,
                highlight_end=approx_end,
                bboxes=bboxes,
                page_width=pw,
                page_height=ph,
                document_version=document_version,
                citation=Citation(
                    verified=True,
                    status=VerificationStatus.VERIFIED,
                    similarity_score=1.0,
                    note="Whitespace-normalized exact match verified against policy source page."
                )
            )

        # Step 6: Pass 3 - Fuzzy similarity check (NEVER mark as VERIFIED!)
        matcher = SequenceMatcher(None, norm_page, norm_cite, autojunk=False)
        match = matcher.find_longest_match(0, len(norm_page), 0, len(norm_cite))
        matching_blocks = matcher.get_matching_blocks()
        total_matched_chars = sum(b.size for b in matching_blocks)
        coverage_ratio = total_matched_chars / max(1, len(norm_cite))
        longest_match_ratio = match.size / max(1, len(norm_cite))
        effective_similarity = round(max(coverage_ratio, longest_match_ratio), 3)

        if effective_similarity >= 0.50 or match.size >= min(25, int(len(norm_cite) * 0.50)):
            return PolicyEvidence(
                document_id=document_id,
                document=document_name,
                page=page_number,
                section=section,
                text=cited_text,
                highlight_start=None,
                highlight_end=None,
                bboxes=[],
                page_width=target_page.width,
                page_height=target_page.height,
                document_version=document_version,
                citation=Citation(
                    verified=False,
                    status=VerificationStatus.SIMILARITY_MATCH,
                    similarity_score=effective_similarity,
                    note=(
                        f"SIMILARITY MATCH ({int(effective_similarity * 100)}% match): "
                        "Quotation contains discrepancies with source text and is rejected from verified evidence."
                    )
                )
            )

        # Step 7: Pass 4 - No match at all
        return PolicyEvidence(
            document_id=document_id,
            document=document_name,
            page=page_number,
            section=section,
            text=cited_text,
            highlight_start=None,
            highlight_end=None,
            bboxes=[],
            page_width=target_page.width,
            page_height=target_page.height,
            document_version=document_version,
            citation=Citation(
                verified=False,
                status=VerificationStatus.NOT_FOUND,
                similarity_score=0.0,
                note="REJECTED: Quote text is not an authentic substring of the retrieved document page."
            )
        )
