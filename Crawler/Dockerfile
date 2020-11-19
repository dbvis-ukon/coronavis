FROM python:3.9-slim

WORKDIR /app

COPY . /app/.

RUN pip install --no-cache-dir --user -r requirements.txt

CMD sh crawler.sh