import typing as t
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.kiwi import KiwiPageData
from app.controllers.kiwi import (
    get_kiwi_page_data,
    add_kiwi_page,
    search_kiwi_pages,
    update_kiwi_page,
)
from database import get_db_session

router = APIRouter(prefix="/kiwi", tags=["kiwi"])


@router.get("/", response_model=KiwiPageData)
def kiwi_page(f_title: str, db: Session = Depends(get_db_session)) -> KiwiPageData:
    return get_kiwi_page_data(db, f_title)


@router.get("/search", response_model=t.List[KiwiPageData])
def search_kiwi_page(
    query: str, db: Session = Depends(get_db_session)
) -> t.List[KiwiPageData]:
    return search_kiwi_pages(db, query)


@router.post("/", response_model=KiwiPageData)
def post_kiwi_page(
    title: str, raw_content: str, db: Session = Depends(get_db_session)
) -> KiwiPageData:
    return add_kiwi_page(db, title, raw_content)


@router.put("/", response_model=KiwiPageData)
def put_kiwi_page(
    f_title: str, title: str, raw_content: str, db: Session = Depends(get_db_session)
) -> KiwiPageData:
    return update_kiwi_page(db, f_title, title, raw_content)
