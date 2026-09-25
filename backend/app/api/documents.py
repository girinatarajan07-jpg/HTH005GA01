"""
Documents API endpoints.
Handles policy PDF uploads, contract PDF uploads, listing, deletions, file serving, and 1-click demo seeding.
"""

from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path
import uuid
import pypdf
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Response
from fastapi.responses import FileResponse

from app.models.schemas import PolicyDocument, ContractDocument, DocumentsResponse
import app.services.pipeline as pl
from app.services.pdf_parser import parse_pdf, render_page_as_image_bytes
from app import config

router = APIRouter(prefix="/documents", tags=["Documents"])


def find_document_file_path(doc_id: str) -> Optional[Path]:
    """Helper to locate physical file on disk by doc_id."""
    pl.seed_sample_documents_if_empty()

    # Direct filename check in sample dirs
    for p in (config.SAMPLE_DATA_DIR / "policies").glob("*.pdf"):
        if p.name == doc_id:
            return p
    for p in (config.SAMPLE_DATA_DIR / "contracts").glob("*.pdf"):
        if p.name == doc_id:
            return p

    # Check upload directory
    for f in config.UPLOAD_DIR.glob(f"{doc_id}_*"):
        if f.is_file():
            return f

    # Check active contract
    if pl.uploaded_contract and pl.uploaded_contract.id == doc_id:
        p = config.SAMPLE_DATA_DIR / "contracts" / pl.uploaded_contract.name
        if p.exists():
            return p

    # Check active policies
    for pol in pl.uploaded_policies:
        if pol.id == doc_id or pol.name == doc_id:
            p = config.SAMPLE_DATA_DIR / "policies" / pol.name
            if p.exists():
                return p

    # Check all sample files
    for p in (config.SAMPLE_DATA_DIR / "policies").glob("*.pdf"):
        if doc_id in p.name or doc_id == p.stem:
            return p
    for p in (config.SAMPLE_DATA_DIR / "contracts").glob("*.pdf"):
        if doc_id in p.name or doc_id == p.stem:
            return p

    return None


@router.get("", response_model=DocumentsResponse)
async def get_documents():
    """
    Returns current list of uploaded policy documents and active contract.
    """
    return DocumentsResponse(
        policies=pl.uploaded_policies,
        contract=pl.uploaded_contract
    )


@router.post("/policies", response_model=List[PolicyDocument])
async def upload_policies(files: List[UploadFile] = File(...)):
    """
    Uploads 1 to 5 policy PDF documents.
    """
    uploaded: List[PolicyDocument] = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for '{file.filename}'. Only PDF documents are allowed."
            )

        doc_id = f"pol-{uuid.uuid4().hex[:6]}"
        dest_path = config.UPLOAD_DIR / f"{doc_id}_{file.filename}"

        contents = await file.read()
        if len(contents) > config.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds maximum allowed size (25MB)."
            )

        dest_path.write_bytes(contents)

        num_pages = 1
        try:
            reader = pypdf.PdfReader(str(dest_path))
            num_pages = len(reader.pages)
        except Exception:
            pass

        doc = PolicyDocument(
            id=doc_id,
            name=file.filename,
            size_bytes=len(contents),
            status="READY",
            pages=num_pages,
            uploaded_at=datetime.now(timezone.utc).isoformat(),
            type="POLICY"
        )
        pl.uploaded_policies.append(doc)
        uploaded.append(doc)

    return uploaded


@router.post("/contract", response_model=ContractDocument)
async def upload_contract(file: UploadFile = File(...)):
    """
    Uploads 1 target contract PDF for compliance analysis.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type for '{file.filename}'. Only PDF documents are allowed."
        )

    doc_id = f"ctr-{uuid.uuid4().hex[:6]}"
    dest_path = config.UPLOAD_DIR / f"{doc_id}_{file.filename}"

    contents = await file.read()
    if len(contents) > config.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{file.filename}' exceeds maximum allowed size (25MB)."
        )

    dest_path.write_bytes(contents)

    num_pages = 1
    try:
        reader = pypdf.PdfReader(str(dest_path))
        num_pages = len(reader.pages)
    except Exception:
        pass

    doc = ContractDocument(
        id=doc_id,
        name=file.filename,
        size_bytes=len(contents),
        status="READY",
        pages=num_pages,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        type="CONTRACT"
    )
    pl.uploaded_contract = doc
    return doc


@router.post("/demo-seed", response_model=DocumentsResponse)
async def seed_demo_data():
    """
    1-Click Demo Seed: Populates the 4 corporate policies and the 15-clause benchmark contract.
    """
    pl.uploaded_policies.clear()
    pl.uploaded_contract = None
    pl.seed_sample_documents_if_empty()
    return DocumentsResponse(
        policies=pl.uploaded_policies,
        contract=pl.uploaded_contract
    )


@router.get("/download/{doc_id}")
async def download_document(doc_id: str):
    """
    Serves the binary PDF document for browser viewing or download.
    """
    fpath = find_document_file_path(doc_id)
    if not fpath or not fpath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document file for ID '{doc_id}' not found."
        )
    return FileResponse(
        path=str(fpath),
        media_type="application/pdf",
        filename=fpath.name,
        headers={"Content-Disposition": f"inline; filename={fpath.name}"}
    )


@router.get("/page-content/{doc_id}/{page_num}")
async def get_page_content(doc_id: str, page_num: int):
    """
    Returns structured text and paragraph block coordinates for a given page.
    Used by the Right Pane Click-to-Source PDF / Document viewer to highlight verbatim quotes.
    """
    fpath = find_document_file_path(doc_id)
    if not fpath or not fpath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document file for '{doc_id}' not found."
        )

    pages = parse_pdf(fpath, doc_id, fpath.name)
    target = next((p for p in pages if p.page_number == page_num), None)
    if not target:
        if pages:
            target = pages[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page {page_num} not found in document '{doc_id}'."
            )

    return target.to_dict()


@router.get("/page-image/{doc_id}/{page_num}")
async def get_page_image(doc_id: str, page_num: int):
    """
    Renders and serves high-resolution PNG image of the specified page.
    Used for visual bounding box highlight overlay in the Source Dock Viewer.
    """
    fpath = find_document_file_path(doc_id)
    if not fpath or not fpath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document file for '{doc_id}' not found."
        )

    img_bytes = render_page_as_image_bytes(fpath, page_num)
    if not img_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not render image for page {page_num} of document '{doc_id}'."
        )

    return Response(content=img_bytes, media_type="image/png")


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str):
    """
    Deletes an uploaded policy or contract by its ID.
    """
    if pl.uploaded_contract and pl.uploaded_contract.id == doc_id:
        target_file = config.UPLOAD_DIR / f"{pl.uploaded_contract.id}_{pl.uploaded_contract.name}"
        if target_file.exists():
            target_file.unlink(missing_ok=True)
        pl.uploaded_contract = None
        return

    pol_to_del = next((p for p in pl.uploaded_policies if p.id == doc_id), None)
    if pol_to_del:
        target_file = config.UPLOAD_DIR / f"{pol_to_del.id}_{pol_to_del.name}"
        if target_file.exists():
            target_file.unlink(missing_ok=True)
        pl.uploaded_policies = [p for p in pl.uploaded_policies if p.id != doc_id]
        return

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Document with ID '{doc_id}' not found."
    )
