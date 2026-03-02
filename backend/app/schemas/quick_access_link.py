import typing as t

from app.util import CustomBaseModel


class QuickAccessLink(CustomBaseModel):
    url: str
    dname: str
    shortcuts: t.List[str]
