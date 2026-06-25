# Image assets stored on disk, not GridFS

MongoDB's conventional approach for binary blobs is GridFS. We store image assets as plain files in `backend/uploads/` instead, served via a dedicated FastAPI route (`GET /uploads/:filename`). GridFS adds two extra collections and a special driver API for what is essentially a file — the filesystem is already a perfectly good blob store. This also makes uploads easy to inspect, back up, or clear independently of the database.
