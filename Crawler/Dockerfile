FROM python:3.10-slim

RUN apt update && apt instally -y fdupes

WORKDIR /app

COPY . /app/.

RUN pip install --no-cache-dir --user -r requirements.txt

CMD sh crawler.sh