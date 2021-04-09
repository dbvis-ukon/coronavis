import multiprocessing

bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
threads = multiprocessing.cpu_count() * 2 + 1

# fails with gunicorn v20.1.0
# print_config = True

accesslog = '-'

loglevel = 'debug'

# 2 minute timeout for worker because of long query times
timeout = 240

# then in the Gunicorn config file:
from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics


def child_exit(server, worker):
    GunicornInternalPrometheusMetrics.mark_process_dead_on_child_exit(worker.pid)
