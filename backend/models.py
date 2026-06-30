from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    template_type: str = "mutual-nda"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentCreate(SQLModel):
    title: str
    template_type: str = "mutual-nda"
    content: str
