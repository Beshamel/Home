import unicodedata
from pydantic import BaseModel


def to_camel_case(string: str) -> str:
    string_split = string.split("_")
    return string_split[0] + "".join(
        element.capitalize() for element in string_split[1:]
    )


def strip_accents(text):
    try:
        text = unicodedata(text, "utf-8")
    except (TypeError, NameError):
        pass
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore")
    text = text.decode("utf-8")
    return str(text)


class CustomBaseModel(BaseModel):

    class Config:
        alias_generator = to_camel_case
        populate_by_name = True
