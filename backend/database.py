import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

_db_path = os.getenv("DATABASE_URL", str(Path(__file__).parent.parent / "data" / "prelegal.db"))
engine = create_engine(f"sqlite:///{_db_path}", echo=False, connect_args={"check_same_thread": False})

def create_db_and_tables():
    # Drop and recreate — DB is intentionally ephemeral (resets on restart)
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
