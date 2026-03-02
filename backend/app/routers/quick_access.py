import typing as t
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.quick_access_link import QuickAccessLink
from app.controllers.quick_access import get_quick_access_links, add_quick_access_link
from database import get_db_session

router = APIRouter(prefix="/quick-access", tags=["quick-access"])


@router.get("/", response_model=t.List[QuickAccessLink])
def quick_access(db: Session = Depends(get_db_session)) -> t.List[QuickAccessLink]:
    return get_quick_access_links(db)

@router.post("/", response_model=QuickAccessLink)
def post_quick_access_link(
    link: QuickAccessLink,
    db: Session = Depends(get_db_session)
) -> QuickAccessLink:
    return add_quick_access_link(db, link)