from tests.conftest import _canvases  # imported for type reference only


# ── list canvases ──────────────────────────────────────────────────────────────

def test_list_empty(client):
    r = client.get("/api/canvases")
    assert r.status_code == 200
    assert r.json() == []


def test_list_excludes_elements(client):
    client.post("/api/canvases", json={"name": "A"})
    canvases = client.get("/api/canvases").json()
    assert "elements" not in canvases[0]


def test_list_sorted_by_updated_desc(client):
    first_id = client.post("/api/canvases", json={"name": "First"}).json()["id"]
    client.post("/api/canvases", json={"name": "Second"})
    # Re-save First to make its updatedAt newer than Second's
    client.put(f"/api/canvases/{first_id}", json={"elements": [], "thumbnail": ""})
    names = [c["name"] for c in client.get("/api/canvases").json()]
    assert names == ["First", "Second"]


# ── create canvas ──────────────────────────────────────────────────────────────

def test_create_returns_201(client):
    r = client.post("/api/canvases", json={})
    assert r.status_code == 201


def test_create_default_name(client):
    r = client.post("/api/canvases", json={})
    assert r.json()["name"] == "Untitled"


def test_create_custom_name(client):
    r = client.post("/api/canvases", json={"name": "My Canvas"})
    assert r.json()["name"] == "My Canvas"


def test_create_response_shape(client):
    r = client.post("/api/canvases", json={})
    body = r.json()
    assert all(k in body for k in ("id", "name", "createdAt", "updatedAt", "thumbnail", "elements"))
    assert body["elements"] == []
    assert body["thumbnail"] == ""


# ── get canvas ─────────────────────────────────────────────────────────────────

def test_get_canvas_returns_elements(client):
    created = client.post("/api/canvases", json={"name": "X"}).json()
    canvas_id = created["id"]
    client.put(f"/api/canvases/{canvas_id}", json={"elements": [{"id": "e1"}], "thumbnail": ""})

    fetched = client.get(f"/api/canvases/{canvas_id}").json()
    assert fetched["elements"] == [{"id": "e1"}]


def test_get_canvas_not_found(client):
    r = client.get("/api/canvases/000000000000000000000001")
    assert r.status_code == 404


# ── save canvas ────────────────────────────────────────────────────────────────

def test_save_canvas_updates_elements_and_thumbnail(client):
    canvas_id = client.post("/api/canvases", json={}).json()["id"]
    elements = [{"id": "e1", "type": "rect"}]
    thumbnail = "data:image/png;base64,abc"

    r = client.put(f"/api/canvases/{canvas_id}", json={"elements": elements, "thumbnail": thumbnail})
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    saved = client.get(f"/api/canvases/{canvas_id}").json()
    assert saved["elements"] == elements
    assert saved["thumbnail"] == thumbnail


def test_save_canvas_not_found(client):
    r = client.put("/api/canvases/000000000000000000000001", json={"elements": [], "thumbnail": ""})
    assert r.status_code == 404


# ── rename canvas ──────────────────────────────────────────────────────────────

def test_rename_canvas(client):
    canvas_id = client.post("/api/canvases", json={"name": "Old"}).json()["id"]

    r = client.patch(f"/api/canvases/{canvas_id}", json={"name": "New"})
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    assert client.get(f"/api/canvases/{canvas_id}").json()["name"] == "New"


def test_rename_canvas_empty_name(client):
    canvas_id = client.post("/api/canvases", json={}).json()["id"]
    r = client.patch(f"/api/canvases/{canvas_id}", json={"name": ""})
    assert r.status_code == 400


def test_rename_canvas_whitespace_name(client):
    canvas_id = client.post("/api/canvases", json={}).json()["id"]
    r = client.patch(f"/api/canvases/{canvas_id}", json={"name": "   "})
    assert r.status_code == 400


def test_rename_canvas_not_found(client):
    r = client.patch("/api/canvases/000000000000000000000001", json={"name": "X"})
    assert r.status_code == 404


# ── delete canvas ──────────────────────────────────────────────────────────────

def test_delete_canvas(client):
    canvas_id = client.post("/api/canvases", json={}).json()["id"]

    r = client.delete(f"/api/canvases/{canvas_id}")
    assert r.status_code == 204

    assert client.get(f"/api/canvases/{canvas_id}").status_code == 404


def test_delete_canvas_not_found(client):
    r = client.delete("/api/canvases/000000000000000000000001")
    assert r.status_code == 404
