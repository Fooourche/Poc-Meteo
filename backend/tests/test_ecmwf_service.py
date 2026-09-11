import pytest

from app.services.ecmwf_service import _parse_base_time


def test_parse_base_time_from_real_example() -> None:
    # Exemple reel tire du notebook officiel ecmwf/notebook-examples
    # (Explore_the_opencharts_API.ipynb), confirmant le format retourne
    # par l'API quand aucun base_time/valid_time n'est precise.
    description = (
        "Base time: Wed 19 Oct 2022 00 UTC Valid time: Wed 19 Oct 2022 00 UTC "
        "(+0h) Area : Europe"
    )
    assert _parse_base_time(description) == "2022-10-19T00:00:00Z"


def test_parse_base_time_with_12z_run() -> None:
    description = "Base time: Mon 09 Sep 2026 12 UTC Valid time: Tue 10 Sep 2026 12 UTC (+24h)"
    assert _parse_base_time(description) == "2026-09-09T12:00:00Z"


def test_parse_base_time_raises_on_unexpected_format() -> None:
    with pytest.raises(ValueError):
        _parse_base_time("Ceci ne contient pas de Base time")
