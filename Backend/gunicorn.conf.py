import multiprocessing
import os


ENVIRONMENT = os.environ.get('ENVIRONMENT').replace('\n', '') if os.environ.get('ENVIRONMENT') else 'development'

bind = "0.0.0.0:5000"

if ENVIRONMENT == 'production':
    workers = multiprocessing.cpu_count() * 2 + 1
    threads = multiprocessing.cpu_count() * 2 + 1
else:
    workers = 1
    threads = 1

print(f'launching server with {workers} workers and {threads} threads')

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
