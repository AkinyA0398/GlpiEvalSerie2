from flask import Flask, request, jsonify
import sqlite3
import os

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    # Minimal CORS to allow front (localhost:5173) to call this backend (localhost:5000)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response



# 🔹 Initialiser la base (une seule fois)
def init_db():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        );

        -- Backoffice: config Kanban (couleurs + libellés malgaches)
        CREATE TABLE IF NOT EXISTS kanban_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status_id INTEGER UNIQUE,
            bg TEXT NOT NULL,
            color TEXT NOT NULL,
            border TEXT NOT NULL,
            label_mg TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()


init_db()

# 🔹 GET → récupérer tous les utilisateurs
@app.route("/users", methods=["GET"])
def get_users():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()

    users = []
    for row in rows:
        users.append({"id": row[0], "name": row[1]})

    return jsonify(users)

# 🔹 POST → ajouter un utilisateur
@app.route("/users", methods=["POST"])
def add_user():
    data = request.get_json()
    name = data.get("name")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "User added"}), 201


def _get_kanban_config_rows():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        """SELECT status_id, bg, color, border, label_mg FROM kanban_config ORDER BY status_id"""
    )
    rows = cursor.fetchall()
    conn.close()
    return rows


def _upsert_kanban_config(payload_list):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    for item in payload_list:
        status_id = int(item.get("status_id"))
        bg = item.get("bg")
        color = item.get("color")
        border = item.get("border")
        label_mg = item.get("label_mg")

        cursor.execute(
            """
            INSERT INTO kanban_config(status_id, bg, color, border, label_mg)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(status_id) DO UPDATE SET
              bg=excluded.bg,
              color=excluded.color,
              border=excluded.border,
              label_mg=excluded.label_mg
            """,
            (status_id, bg, color, border, label_mg),
        )

    conn.commit()
    conn.close()


# 🔹 BACKOFFICE: Kanban config
@app.route("/kanban/config", methods=["GET"])
def get_kanban_config():
    rows = _get_kanban_config_rows()
    # payload client: [ {status_id, bg, color, border, label_mg}, ... ]
    data = [
        {
            "status_id": r[0],
            "bg": r[1],
            "color": r[2],
            "border": r[3],
            "label_mg": r[4],
        }
        for r in rows
    ]
    return jsonify(data)


@app.route("/kanban/config", methods=["POST"])
def post_kanban_config():
    payload = request.get_json() or []

    # expects list of 3 items (or any length)
    if not isinstance(payload, list) or len(payload) == 0:
        return jsonify({"message": "payload must be a non-empty list"}), 400

    required = {"status_id", "bg", "color", "border", "label_mg"}
    for item in payload:
        if not isinstance(item, dict):
            return jsonify({"message": "each item must be an object"}), 400
        missing = required - set(item.keys())
        if missing:
            return jsonify({"message": f"missing fields: {sorted(list(missing))}"}), 400

    _upsert_kanban_config(payload)
    return jsonify({"message": "Kanban config saved"}), 200


@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({"id": row[0], "name": row[1]})
    else:
        return jsonify({"message": "User not found"}), 404
@app.route("/users/search", methods=["GET"])
def search_user():
    name = request.args.get("name")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE name LIKE ?", ('%' + name + '%',))
    rows = cursor.fetchall()
    conn.close()

    users = []
    for row in rows:
        users.append({"id": row[0], "name": row[1]})

    return jsonify(users)
@app.route("/users/filter", methods=["GET"])
def filter_users():
    name = request.args.get("name")
    min_id = request.args.get("min_id")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()

    query = "SELECT * FROM users WHERE 1=1"
    params = []

    if name:
        query += " AND name LIKE ?"
        params.append('%' + name + '%')

    if min_id:
        query += " AND id >= ?"
        params.append(min_id)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{"id": r[0], "name": r[1]} for r in rows])
# 🔹 Lancer le serveur
if __name__ == "__main__":
    app.run(debug=True)