from datetime import datetime
from math import floor


def get_start() -> datetime:
    return datetime.now()


def get_execution_time(start: datetime) -> str:
    delta = datetime.now() - start
    if delta.seconds < 60:
        return f'{delta.seconds} seconds'
    elif 60 <= delta.seconds < 3600:
        return f'{floor(delta.seconds / 60)} minutes {delta.seconds % 60} seconds'
    else:
        return f'{floor(delta.seconds / 3600)} hours {floor(delta.seconds / 60)} minutes {delta.seconds % 60} seconds'
