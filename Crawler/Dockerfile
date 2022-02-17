FROM python:3.10-slim

RUN apt-get update && apt-get install -y fdupes

WORKDIR /app

COPY . /app/.

RUN pip install --no-cache-dir --user -r requirements.txt

CMD sh crawler.sh