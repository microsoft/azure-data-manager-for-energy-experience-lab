# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM python:3.11-slim

RUN pip install --no-cache-dir requests>=2.31.0

COPY loader.py /app/loader.py

WORKDIR /app

CMD ["python", "/app/loader.py"]
