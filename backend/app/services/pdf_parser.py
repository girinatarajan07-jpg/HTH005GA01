"""
PDF and Document Parser Service.
Extracts structured text page-by-page with paragraph/block coordinates.
Supports PyMuPDF (fitz) with fallback to pypdf.
Computes precise multi-line bounding box coordinates for verbatim citations.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

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
        blocks: Optional[List[TextBlock]] = None,
        width: float = 612.0,
        height: float = 792.0,
        file_path: Optional[str] = None
    ):
        self.page_number = page_number
        self.text = text
        self.document_id = document_id
        self.document_name = document_name
        self.blocks = blocks or []
        self.width = width
        self.height = height
        self.file_path = file_path

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "document_id": self.document_id,
            "document_name": self.document_name,
            "width": round(self.width, 2),
            "height": round(self.height, 2),
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
                        blocks=blocks,
                        width=page.rect.width,
                        height=page.rect.height,
                        file_path=str(file_path)
                    ))
                doc.close()
                return pages
            except Exception:
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
                        document_name=document_name,
                        width=612.0,
                        height=792.0,
                        file_path=str(file_path)
                    ))
        except Exception as e:
            raise RuntimeError(f"Error parsing PDF '{file_path.name}': {str(e)}")
    else:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        page_chunks = content.split("---PAGE---")
        for idx, chunk in enumerate(page_chunks):
            cleaned = chunk.strip()
            if cleaned:
                pages.append(DocumentPage(
                    page_number=idx + 1,
                    text=cleaned,
                    document_id=document_id,
                    document_name=document_name,
                    file_path=str(file_path)
                ))

    return pages


def search_phrase_bboxes(
    file_path: Path,
    page_number: int,
    phrase: str
) -> Tuple[List[List[float]], float, float]:
    """
    Locates exact bounding box coordinates [x0, y0, x1, y1] for a phrase within a given PDF page.
    Supports multi-line bounding boxes when the citation wraps across lines.
    Returns (bboxes, page_width, page_height).
    """
    if not file_path.exists() or not PYMUPDF_AVAILABLE or file_path.suffix.lower() != ".pdf":
        return [], 612.0, 792.0

    try:
        doc = pymupdf.open(str(file_path))
        if page_number < 1 or page_number > len(doc):
            doc.close()
            return [], 612.0, 792.0

        page = doc[page_number - 1]
        page_w = page.rect.width
        page_h = page.rect.height

        phrase_clean = phrase.strip()
        rects = page.search_for(phrase_clean)

        # If not found directly, search line-by-line
        if not rects:
            lines = [l.strip() for l in phrase_clean.splitlines() if len(l.strip()) > 3]
            for l in lines:
                found_rects = page.search_for(l)
                rects.extend(found_rects)

        # If still not found, try searching sentence chunks
        if not rects:
            sentences = [s.strip() for s in phrase_clean.replace("\n", " ").split(". ") if len(s.strip()) > 10]
            for s in sentences:
                found_rects = page.search_for(s[:60])
                rects.extend(found_rects)

        bboxes = [[round(r.x0, 2), round(r.y0, 2), round(r.x1, 2), round(r.y1, 2)] for r in rects]
        doc.close()
        return bboxes, round(page_w, 2), round(page_h, 2)
    except Exception:
        return [], 612.0, 792.0


def render_page_as_image_bytes(file_path: Path, page_number: int, dpi: int = 150) -> Optional[bytes]:
    """
    Renders a given page of a PDF document to PNG image bytes for visual UI overlay.
    """
    if not file_path.exists() or not PYMUPDF_AVAILABLE or file_path.suffix.lower() != ".pdf":
        return None

    try:
        doc = pymupdf.open(str(file_path))
        if page_number < 1 or page_number > len(doc):
            doc.close()
            return None
        page = doc[page_number - 1]
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes
    except Exception:
        return None
