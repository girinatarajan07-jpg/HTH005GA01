"""
Contract Clause Extractor Service.
Segments contract documents into structured clauses for compliance cross-checking.
Preserves clause numbers, headings, text, and page provenance.
"""

import re
from typing import List, Dict, Any
from app.services.pdf_parser import DocumentPage


class ExtractedClause:
    def __init__(self, clause_id: str, clause_number: str, clause_title: str, clause_text: str):
        self.clause_id = clause_id
        self.clause_number = clause_number
        self.clause_title = clause_title
        self.clause_text = clause_text

    def to_dict(self) -> Dict[str, Any]:
        return {
            "clause_id": self.clause_id,
            "clause_number": self.clause_number,
            "clause_title": self.clause_title,
            "clause_text": self.clause_text,
        }


def extract_contract_clauses(pages: List[DocumentPage]) -> List[ExtractedClause]:
    """
    Parses contract pages and segments into numbered clauses.
    Handles standard contract numbering formats like:
      - 'Clause 1: Provision of Services and Grant of License'
      - 'Section 3.2 Security Incident Notification'
      - 'Article IV - Limitation of Liability'
      - '1. Invoicing and Payment Terms'
    """
    full_text = "\n\n".join(page.text for page in pages)
    clauses: List[ExtractedClause] = []

    # Strict regex pattern to identify clause boundary starts
    # E.g. "Clause 1:", "Section 2.1 -", "Article 3.", or "^1. Term"
    pattern = re.compile(
        r"(?:^|\n\n)\s*(?:(Clause|Section|Article)\s+([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)[\.\:\-]\s*([^\n\r]+)|([0-9]{1,2})\.\s+([A-Z][^\n\r]+))",
        re.MULTILINE
    )

    matches = list(pattern.finditer(full_text))

    if not matches:
        # Fallback segmentation: Split by double newline
        blocks = [b.strip() for b in full_text.split("\n\n") if len(b.strip()) > 40]
        for idx, block in enumerate(blocks, start=1):
            clauses.append(ExtractedClause(
                clause_id=f"clause-{idx:02d}",
                clause_number=f"Clause {idx}",
                clause_title=f"Section {idx}",
                clause_text=block
            ))
        return clauses

    for i, match in enumerate(matches):
        start_idx = match.start()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        
        block = full_text[start_idx:end_idx].strip()
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue

        header_line = lines[0]
        body_text = "\n".join(lines[1:]).strip() if len(lines) > 1 else header_line

        # Match clause details
        prefix_type = match.group(1)
        num = match.group(2)
        title = match.group(3)
        alt_num = match.group(4)
        alt_title = match.group(5)

        if num:
            c_num = f"{prefix_type or 'Clause'} {num}"
            c_title = (title or "").strip()
        elif alt_num:
            c_num = f"Clause {alt_num}"
            c_title = (alt_title or "").strip()
        else:
            c_num = f"Clause {i+1}"
            c_title = header_line[:50]

        # Extract only the actual clause body (excluding duplicate header)
        clause_full_text = f"{c_num}: {c_title}\n{body_text}" if body_text != header_line else header_line

        clauses.append(ExtractedClause(
            clause_id=f"clause-{i+1:02d}",
            clause_number=c_num,
            clause_title=c_title or f"Clause {i+1}",
            clause_text=clause_full_text
        ))

    return clauses
