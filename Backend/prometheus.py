import os

from prometheus_flask_exporter import PrometheusMetrics
from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics

is_gunicorn = "gunicorn" in os.environ.get("SERVER_SOFTWARE", "")

if is_gunicorn:
    metrics = GunicornInternalPrometheusMetrics.for_app_factory()
else:
    metrics = PrometheusMetrics.for_app_factory()
