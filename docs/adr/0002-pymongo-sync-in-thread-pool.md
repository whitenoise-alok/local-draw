# PyMongo (sync) over Motor (async) for MongoDB access

FastAPI is async, making Motor (the async MongoDB driver) the conventional choice. We chose PyMongo instead, using FastAPI's built-in thread pool for sync route handlers (declaring routes as `def` rather than `async def`). The reason is simplicity: PyMongo's API is more widely documented, easier to debug, and the thread pool overhead is irrelevant for a single-user local tool with negligible concurrency.
