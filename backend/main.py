import os
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/local-draw")
client = MongoClient(MONGO_URL)
db = client.get_default_database()
canvases = db["canvases"]

app = FastAPI()


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@app.get("/api/canvases")
def list_canvases():
    docs = canvases.find({}, {"elements": 0}).sort("updatedAt", -1)
    return [_serialize(d) for d in docs]


@app.post("/api/canvases", status_code=201)
def create_canvas(body: dict = None):
    now = datetime.now(timezone.utc)
    doc = {
        "name": (body or {}).get("name", "Untitled"),
        "createdAt": now,
        "updatedAt": now,
        "thumbnail": "",
        "elements": [],
    }
    result = canvases.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@app.get("/api/canvases/{canvas_id}")
def get_canvas(canvas_id: str):
    doc = canvases.find_one({"_id": ObjectId(canvas_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return _serialize(doc)


@app.put("/api/canvases/{canvas_id}")
def save_canvas(canvas_id: str, body: dict):
    now = datetime.now(timezone.utc)
    result = canvases.update_one(
        {"_id": ObjectId(canvas_id)},
        {"$set": {
            "elements": body.get("elements", []),
            "thumbnail": body.get("thumbnail", ""),
            "updatedAt": now,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return {"ok": True}


@app.patch("/api/canvases/{canvas_id}")
def rename_canvas(canvas_id: str, body: dict):
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    now = datetime.now(timezone.utc)
    result = canvases.update_one(
        {"_id": ObjectId(canvas_id)},
        {"$set": {"name": name, "updatedAt": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return {"ok": True}


@app.delete("/api/canvases/{canvas_id}", status_code=204)
def delete_canvas(canvas_id: str):
    result = canvases.delete_one({"_id": ObjectId(canvas_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Canvas not found")


UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "frontend"), html=True), name="frontend")
