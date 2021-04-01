from prometheus_flask_exporter import PrometheusMetrics

metrics = PrometheusMetrics.for_app_factory(path='/metrics')