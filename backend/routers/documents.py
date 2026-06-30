from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Document, DocumentCreate

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
def list_documents(session: Session = Depends(get_session)):
    return session.exec(select(Document).order_by(Document.created_at.desc())).all()


@router.get("/{doc_id}")
def get_document(doc_id: int, session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("", status_code=201)
def create_document(payload: DocumentCreate, session: Session = Depends(get_session)):
    doc = Document(**payload.model_dump())
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    session.delete(doc)
    session.commit()


@router.put("/{doc_id}")
def update_document(doc_id: int, payload: DocumentCreate, session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    for key, value in payload.model_dump().items():
        setattr(doc, key, value)
    doc.updated_at = datetime.utcnow()
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc
