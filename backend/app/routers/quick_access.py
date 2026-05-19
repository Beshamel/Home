import typing as t
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.quick_access_link import QuickAccessLink
from app.controllers.quick_access import (
    add_quick_access_shortcut,
    edit_quick_access_link,
    get_quick_access_links,
    add_quick_access_link,
    remove_quick_access_link,
    remove_quick_access_shortcut,
)
from database import get_db_session

router = APIRouter(prefix="/quick-access", tags=["quick-access"])


@router.get("/", response_model=t.List[QuickAccessLink])
def quick_access(db: Session = Depends(get_db_session)) -> t.List[QuickAccessLink]:
    return get_quick_access_links(db)


@router.post("/", response_model=QuickAccessLink)
def post_quick_access_link(
    dname: str, url: str, db: Session = Depends(get_db_session)
) -> QuickAccessLink:
    return add_quick_access_link(db, dname, url)


@router.put("/", response_model=QuickAccessLink)
def put_quick_access_link(
    url: t.Optional[str] = None,
    new_dname: t.Optional[str] = None,
    new_url: t.Optional[str] = None,
    oldUrl: t.Optional[str] = None,
    dname: t.Optional[str] = None,
    db: Session = Depends(get_db_session),
) -> QuickAccessLink:
    original_url = oldUrl or url
    if original_url is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Original URL must be provided as url or oldUrl",
        )

    updated_dname = new_dname if new_dname is not None else dname
    updated_url = (
        new_url if new_url is not None else (url if oldUrl is not None else None)
    )
    return edit_quick_access_link(db, original_url, updated_dname, updated_url)


@router.delete("/", response_model=QuickAccessLink)
def delete_quick_access_link(
    url: str, db: Session = Depends(get_db_session)
) -> QuickAccessLink:
    return remove_quick_access_link(db, url)


@router.post("/shortcut", response_model=QuickAccessLink)
def post_quick_access_shortcut(
    url: str, shortcut: str, db: Session = Depends(get_db_session)
) -> QuickAccessLink:
    return add_quick_access_shortcut(db, url, shortcut)


@router.delete("/shortcut", response_model=QuickAccessLink)
def delete_quick_access_shortcut(
    url: str, shortcut: str, db: Session = Depends(get_db_session)
) -> QuickAccessLink:
    return remove_quick_access_shortcut(db, url, shortcut)
