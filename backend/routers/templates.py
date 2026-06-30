import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/templates", tags=["templates"])

CATALOG_PATH = Path(__file__).parent.parent.parent / "catalog.json"


@router.get("")
def list_templates():
    try:
        with open(CATALOG_PATH) as f:
            catalog = json.load(f)
        return catalog["templates"]
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="catalog.json not found")
