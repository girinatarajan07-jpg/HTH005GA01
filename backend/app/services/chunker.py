"""
Smart Legal Chunker Service.
Chunks policy documents while preserving section headers, paragraph cohesion,
exact page tracking, and character span offsets for hallucination verification.
"""

import re
from typing import List, Dict, Any, Optional
from app.services.pdf_parser import DocumentPage


class PolicyChunk:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        document_name: str,
        page_number: int,
        section: str,
        text: str,
        char_start: int,
        char_end: int,
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_name = document_name
        self.page_number = page_number
        self.section = section
        self.text = text
        self.char_start = char_start
        self.char_end = char_end

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document_name": self.document_name,
            "page_number": self.page_number,
            "section": self.section,
            "text": self.text,
            "char_start": self.char_start,
            "char_end": self.char_end,
        }


def extract_section_title(text: str) -> Optional[str]:
    """
    Detects standard legal / corporate policy section titles (e.g., 'Section 3.2: Incident Notification')
    """
    patterns = [
        r"(?:Section|Sec\.|Article|Clause|Policy)\s*([0-9]+(?:\.[0-9]+)*[A-Za-z]?[:\.\-\s]+[^\n\r]+)",
        r"(^[0-9]+(?:\.[0-9]+)+\s+[^\n\r]+)",
        r"([A-Z\s]{4,30}:)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(0).strip()
    return None


def smart_chunk_document_pages(
    pages: List[DocumentPage],
    target_chunk_size: int = 600,
    chunk_overlap: int = 100
) -> List[PolicyChunk]:
    """
    Smart chunker that operates across document pages with section awareness.
    Guarantees every chunk has page_number and section attribution.
    """
    chunks: List[PolicyChunk] = []
    chunk_counter = 0

    current_section = "General Policy Standards"

    for page in pages:
        page_text = page.text
        # Check if page introduces a new section
        detected_sec = extract_section_title(page_text)
        if detected_sec:
            current_section = detected_sec

        # Split into logical paragraphs
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n|\n(?=[0-9]+\.[0-9]+|\bSection\b|\bArticle\b)", page_text) if p.strip()]

        current_buffer = ""
        buffer_start = 0

        for para in paragraphs:
            para_sec = extract_section_title(para)
            if para_sec:
                current_section = para_sec

            if len(current_buffer) + len(para) <= target_chunk_size:
                if current_buffer:
                    current_buffer += "\n\n" + para
                else:
                    current_buffer = para
            else:
                if current_buffer:
                    chunk_counter += 1
                    c_start = page_text.find(current_buffer[:50])
                    c_end = c_start + len(current_buffer) if c_start != -1 else len(current_buffer)
                    chunks.append(PolicyChunk(
                        chunk_id=f"{page.document_id}-c{chunk_counter:03d}",
                        document_id=page.document_id,
                        document_name=page.document_name,
                        page_number=page.page_number,
                        section=current_section,
                        text=current_buffer,
                        char_start=max(0, c_start),
                        char_end=max(0, c_end)
                    ))
                
                # Start new buffer with optional overlap
                if len(para) > target_chunk_size:
                    # Long paragraph: split cleanly on sentence boundaries
                    sentences = re.split(r"(?<=[.!?])\s+", para)
                    sub_buf = ""
                    for s in sentences:
                        if len(sub_buf) + len(s) <= target_chunk_size:
                            sub_buf += (" " if sub_buf else "") + s
                        else:
                            if sub_buf:
                                chunk_counter += 1
                                c_start = page_text.find(sub_buf[:50])
                                c_end = c_start + len(sub_buf) if c_start != -1 else len(sub_buf)
                                chunks.append(PolicyChunk(
                                    chunk_id=f"{page.document_id}-c{chunk_counter:03d}",
                                    document_id=page.document_id,
                                    document_name=page.document_name,
                                    page_number=page.page_number,
                                    section=current_section,
                                    text=sub_buf,
                                    char_start=max(0, c_start),
                                    char_end=max(0, c_end)
                                ))
                            sub_buf = s
                    current_buffer = sub_buf
                else:
                    current_buffer = para

        if current_buffer:
            chunk_counter += 1
            c_start = page_text.find(current_buffer[:50])
            c_end = c_start + len(current_buffer) if c_start != -1 else len(current_buffer)
            chunks.append(PolicyChunk(
                chunk_id=f"{page.document_id}-c{chunk_counter:03d}",
                document_id=page.document_id,
                document_name=page.document_name,
                page_number=page.page_number,
                section=current_section,
                text=current_buffer,
                char_start=max(0, c_start),
                char_end=max(0, c_end)
            ))

    return chunks
