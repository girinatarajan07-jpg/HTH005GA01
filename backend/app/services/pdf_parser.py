"""
PDF and Document Parser Service.
Extracts structured text page-by-page with paragraph/block coordinates.
Supports PyMuPDF (fitz) with fallback to pypdf.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import pymupdf
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

import pypdf


class TextBlock:
    def __init__(self, text: str, x0: float, y0: float, x1: float, y1: float, block_no: int):
        self.text = text
        self.x0 = x0
        self.y0 = y0
        self.x1 = x1
        self.y1 = y1
        self.block_no = block_no

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "bbox": [round(self.x0, 2), round(self.y0, 2), round(self.x1, 2), round(self.y1, 2)],
            "block_no": self.block_no
        }


class DocumentPage:
    def __init__(
        self,
        page_number: int,
        text: str,
        document_id: str,
        document_name: str,
        blocks: Optional[List[TextBlock]] = None
    ):
        self.page_number = page_number
        self.text = text
        self.document_id = document_id
        self.document_name = document_name
        self.blocks = blocks or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "document_id": self.document_id,
            "document_name": self.document_name,
            "blocks": [b.to_dict() for b in self.blocks]
        }


def parse_pdf(file_path: Path, document_id: str, document_name: str) -> List[DocumentPage]:
    """
    Parses a PDF file into a list of DocumentPage objects preserving page indices
    and paragraph/block coordinates.
    """
    pages: List[DocumentPage] = []
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if file_path.suffix.lower() == ".pdf":
        if PYMUPDF_AVAILABLE:
            try:
                doc = pymupdf.open(str(file_path))
                for idx, page in enumerate(doc):
                    # extract blocks: (x0, y0, x1, y1, text, block_no, block_type)
                    raw_blocks = page.get_text("blocks")
                    blocks: List[TextBlock] = []
                    page_text_parts = []
                    for b in raw_blocks:
                        b_text = b[4].strip()
                        if b_text:
                            blocks.append(TextBlock(
                                text=b_text,
                                x0=b[0],
                                y0=b[1],
                                x1=b[2],
                                y1=b[3],
                                block_no=b[5]
                            ))
                            page_text_parts.append(b_text)
                    
                    full_text = "\n\n".join(page_text_parts) if page_text_parts else (page.get_text() or "").strip()
                    pages.append(DocumentPage(
                        page_number=idx + 1,
                        text=full_text,
                        document_id=document_id,
                        document_name=document_name,
                        blocks=blocks
                    ))
                doc.close()
                return pages
            except Exception:
                # Fallback to pypdf on any PyMuPDF error
                pass

        # pypdf fallback
        try:
            reader = pypdf.PdfReader(str(file_path))
            for idx, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                cleaned_lines = [line.strip() for line in extracted.splitlines() if line.strip()]
                page_text = "\n".join(cleaned_lines)
                if page_text:
                    pages.append(DocumentPage(
                        page_number=idx + 1,
                        text=page_text,
                        document_id=document_id,
                        document_name=document_name
                    ))
        except Exception as e:
            raise RuntimeError(f"Error parsing PDF '{file_path.name}': {str(e)}")
    else:
        # Plain text / markdown fallback
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        page_chunks = content.split("---PAGE---")
        for idx, chunk in enumerate(page_chunks):
            cleaned = chunk.strip()
            if cleaned:
                pages.append(DocumentPage(
                    page_number=idx + 1,
                    text=cleaned,
                    document_id=document_id,
                    document_name=document_name
                ))

    return pages
