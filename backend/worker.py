#!/usr/bin/env python3
import os
import sys
from rq import Worker, Connection
from redis import Redis

# Add the current directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    redis_conn = Redis(host="redis", port=6379, db=0)
    with Connection(redis_conn):
        worker = Worker(["default"])
        worker.work()
