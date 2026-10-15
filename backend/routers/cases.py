from typing import List
from fastapi import APIRouter
from ..reference_cases import REFERENCE_CASES
from ..schemas import ReferenceCase

router = APIRouter(prefix="/cases", tags=["cases"])

@router.get("/reference", response_model=List[ReferenceCase])
def get_reference_cases():
    """
    Returns synthetic precedent cases for historical dispute similarity and educational reference.
    """
    return REFERENCE_CASES
