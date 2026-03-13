import multiprocessing
import os

workers = int(os.getenv('GUNICORN_WORKERS', '3'))
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
threads = 2

timeout = 120  # Increased for image rendering
graceful_timeout = 30
keepalive = 5

accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

bind = '0.0.0.0:8000'
daemon = False
pidfile = '/var/run/gunicorn.pid'

limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

proc_name = 'misfits_battle'

def on_starting(server):
    """Called just before the master process is initialized."""
    print("Starting Gunicorn server...")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    print("Reloading Gunicorn server...")

def when_ready(server):
    """Called just after the server is started."""
    print(f"Gunicorn server is ready. Listening on {bind}")

def on_exit(server):
    """Called just before exiting Gunicorn."""
    print("Shutting down Gunicorn server...")
