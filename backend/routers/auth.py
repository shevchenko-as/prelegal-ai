import hashlib
import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlmodel import Session, select
from database import get_session
from models import User, Session as UserSession

router = APIRouter()


# ── Password helpers ──────────────────────────────────────────────────────────

def _hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


def hash_password(password: str) -> tuple[str, str]:
    salt = uuid.uuid4().hex
    return _hash(password, salt), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    return _hash(password, salt) == stored_hash


# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    session = db.exec(select(UserSession).where(UserSession.token == token)).first()
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=AuthResponse)
def register(body: AuthRequest, db: Session = Depends(get_session)):
    existing = db.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(body.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    pw_hash, salt = hash_password(body.password)
    user = User(email=body.email, password_hash=f"{salt}:{pw_hash}")
    db.add(user)
    db.commit()
    db.refresh(user)

    token = uuid.uuid4().hex
    db.add(UserSession(user_id=user.id, token=token))
    db.commit()

    return AuthResponse(token=token, user={"email": user.email})


@router.post("/auth/login", response_model=AuthResponse)
def login(body: AuthRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == body.email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    salt, pw_hash = user.password_hash.split(":", 1)
    if not verify_password(body.password, pw_hash, salt):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = uuid.uuid4().hex
    db.add(UserSession(user_id=user.id, token=token))
    db.commit()

    return AuthResponse(token=token, user={"email": user.email})


@router.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email}
