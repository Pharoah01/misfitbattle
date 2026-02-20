import multiprocessing

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeouts
timeout = 30
keepalive = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Server mechanics
bind = '0.0.0.0:8000'
daemon = False
