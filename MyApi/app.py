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

    # Migration simple: si la table cost_tickets existe déjà sans colonnes,
    # on ajoute les colonnes manquantes.
    cursor.execute("PRAGMA table_info(cost_tickets)")
    cols = {row[1] for row in cursor.fetchall()}
    required_cols = {
        'origin_price',
        'added_price',
        'total_price',
    }
    for c in required_cols - cols:
        cursor.execute(f"ALTER TABLE cost_tickets ADD COLUMN {c} NUMBER NOT NULL DEFAULT 0")

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
        
        CREATE TABLE IF NOT EXISTS cost_tickets(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER NOT NULL,
            ticket_cost_line_id INTEGER,
            origin_price NUMBER NOT NULL DEFAULT 0,
            added_price NUMBER NOT NULL DEFAULT 0,
            total_price NUMBER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_cost_tickets_ticket
        ON cost_tickets(ticket_id);


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


# =====================================================
# 🔹 Coûts / TicketCost (Flask / SQLite)
# =====================================================



@app.route("/ticket-costs/new-price", methods=["POST"])
def post_ticket_cost_new_price():
    """
    Payload JSON attendu:
      {
        "ticketId": number,
        "ticketCostLineId": number | null,  // optionnel (id GLPI TicketCost ligne)
        "costValue": number
      }

    Enregistre un “nouveau prix” côté application.
    """
    data = request.get_json() or {}
    ticket_id = data.get("ticketId")
    cost_line_id = data.get("ticketCostLineId")
    cost_value = data.get("costValue")

    if ticket_id is None or cost_value is None:
        return jsonify({"message": "ticketId et costValue sont requis"}), 400

    try:
        ticket_id = int(ticket_id)
        cost_value = float(cost_value)
        if cost_line_id is not None and cost_line_id != "":
            cost_line_id = int(cost_line_id)
        else:
            cost_line_id = None
    except Exception:
        return jsonify({"message": "ticketId et costValue doivent être des nombres"}), 400

    # IMPORTANT métier:
    # - origin_price = somme des lignes GLPI TicketCost (cost_fixed + cost_material + cost_time * actiontime)
    # - added_price = coût saisi depuis le Kanban
    # - total_price = origin_price + added_price
    origin_price = 0.0

    try:
        # Récupération des lignes GLPI TicketCost depuis l’API GLPI.
        # Note: on calcule côté Flask (backend) pour éviter tout calcul front.
        import requests

        glpi_base = "http://glpi.localhost/apirest.php"
        app_token = "7JjLfaEu6uCk5OsZVp3nnCG8FzpyW5s2xkgGYWzD"

        # Certaines installations GLPI exigent une session. Comme le backend n’a pas forcément la session,
        # on tente sans Session-Token (fonctionne selon config).
        url = f"{glpi_base}/TicketCost?tickets_id={ticket_id}&app_token={app_token}"
        resp = requests.get(url, headers={"Accept": "application/json"}, timeout=20)
        resp.raise_for_status()
        lines = resp.json() if resp is not None else []

        if isinstance(lines, list):
            for line in lines:
                fixed = float(line.get("cost_fixed") or 0)
                material = float(line.get("cost_material") or 0)
                hourly = float(line.get("cost_time") or 0)
                minutes = int(line.get("actiontime") or 0)
                origin_price += fixed + material + (hourly * (minutes / 60.0))
    except Exception:
        origin_price = 0.0

    added_price = float(cost_value)
    total_price = float(origin_price) + float(added_price)

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO cost_tickets(ticket_id, ticket_cost_line_id, origin_price, added_price, total_price)
        VALUES (?, ?, ?, ?, ?)
        """,
        (ticket_id, cost_line_id, origin_price, added_price, total_price),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({"message": "new price saved", "id": new_id}), 201


@app.route("/ticket-costs/recap", methods=["GET"])
def get_ticket_costs_recap():
    """
    QP: ticketId

    Retourne un récapitulatif (par type PC/Monitor/Phone)
    utilisant la règle métier:
      - si le ticket a N lignes TicketCost (côté GLPI), alors on divise costValue/N.

    NB: Mapping type equipment -> PC/Monitor/Phone
    est à intégrer côté GLPI ultérieurement.

    Pour démarrer proprement, on renvoie une répartition “totale” sur un bucket par défaut 'unknown'
    si le mapping n'est pas disponible.
    """
    ticket_id = request.args.get("ticketId")
    if ticket_id is None or ticket_id == "":
        return jsonify({"message": "ticketId est requis"}), 400

    try:
        ticket_id = int(ticket_id)
    except Exception:
        return jsonify({"message": "ticketId invalide"}), 400

    # 1) récupérer les lignes “ajout prix” depuis SQLite
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM cost_tickets WHERE ticket_id = ?",
        (ticket_id,),
    )
    line_count = cursor.fetchone()[0] or 0

    cursor.execute(
        "SELECT ticket_cost_line_id, origin_price, added_price, total_price FROM cost_tickets WHERE ticket_id = ? ORDER BY id ASC",
        (ticket_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    if len(rows) == 0:
        return jsonify({
            "ticketId": ticket_id,
            "ticketCostLines": 0,
            "totals": {"PC": 0, "Monitor": 0, "Phone": 0},
            "origin_total": 0,
            "added_total": 0,
            "grand_total": 0,
        })

    # Si plusieurs entrées “nouveau prix” existent, on répartit comme avant sur N.
    n = max(int(line_count), 1)

    origin_total = 0.0
    added_total = 0.0
    grand_total = 0.0
    for _line_id, origin_price, added_price, total_price in rows:
        origin_total += float(origin_price) / n
        added_total += float(added_price) / n
        grand_total += float(total_price) / n

    # Répartition provisoire par type
    totals = {
        "PC": grand_total / 3,
        "Monitor": grand_total / 3,
        "Phone": grand_total / 3,
    }

    return jsonify({
        "ticketId": ticket_id,
        "ticketCostLines": n,
        "totals": totals,
        "origin_total": origin_total,
        "added_total": added_total,
        "grand_total": grand_total,
        "note": "Répartition PC/Monitor/Phone provisoire: mapping GLPI à intégrer."
    })



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