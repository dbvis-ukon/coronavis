import os

from prometheus_flask_exporter import PrometheusMetrics
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

# metrics = PrometheusMetrics.for_app_factory(path='/metrics')

metrics = GunicornPrometheusMetrics.for_app_factory(path='/metrics')
