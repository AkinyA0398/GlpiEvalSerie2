from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

# Fonction pour initialiser la base et ajouter la colonne si elle n'existe pas
def init_db():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    # On protège "group" avec des guillemets car c'est un mot-clé réservé SQL
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY,
            couleur TEXT,
            name_fr TEXT,
            name_en TEXT,
            name_mg TEXT
        ); 
        CREATE TABLE IF NOT EXISTS costItem (
            id INTEGER PRIMARY KEY,
            item_id TEXT,
            cost INT DEFAULT 0,
            prix INT DEFAULT 0,
            id_ticket INT,
            gp TIMESTAMP,
            mode TEXT DEFAULT '1',
            pourcentage REAL DEFAULT 0
        );
    """)
    
    try:
        cursor.execute("ALTER TABLE costItem ADD COLUMN mode TEXT DEFAULT '1'")
        cursor.execute("ALTER TABLE costItem ADD COLUMN pourcentage REAL DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    
    cursor.execute("SELECT COUNT(*) FROM status")
    count = cursor.fetchone()[0]
    
    if count == 0:
        default_statuses = [
            (1, '#00d2ff', 'Nouveau', ' ', 'Vaovao'),
            (2, '#38bdf8', 'En cours', ' ', 'Efa manao'),
            (6, '#10b981', 'Résolu', ' ', 'Vita')
        ]
        
        cursor.executemany("""
            INSERT INTO status (id, couleur, name_fr, name_en, name_mg) 
            VALUES (?, ?, ?, ?, ?)
        """, default_statuses)
        
        print("-> Base SQLite initialisée avec les ID GLPI (1, 2, 6) et les traductions.")
    
    conn.commit()
    conn.close()

init_db()

@app.route("/status", methods=["GET"])
def get_status():
    lang = request.args.get("lang", "fr").lower()
    
    if lang == "en":
        column_name = "name_en"
    elif lang == "mg":
        column_name = "name_mg"
    else:
        column_name = "name_fr"

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    query = f"SELECT id, couleur, {column_name} FROM status"
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    status_list = []
    for row in rows:
        status_list.append({
            "id": row[0],
            "couleur": row[1],
            "name": row[2] or "Sans nom"
        })
    return jsonify(status_list)

@app.route("/status", methods=["POST"])
def add_status():
    data = request.get_json()
    couleur = data.get("couleur")
    name_fr = data.get("name_fr")
    name_en = data.get("name_en")
    name_mg = data.get("name_mg")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO status (couleur, name_fr, name_en, name_mg) VALUES (?, ?, ?, ?)", 
        (couleur, name_fr, name_en, name_mg)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Status added"}), 201

@app.route("/cost", methods=["POST"])
def add_cost():
    data = request.get_json()
    item_id = data.get("item_id")
    cost = data.get("cost")
    ticket = data.get("ticket_id")
    gp = data.get("gp")
    mode = data.get("mode", "1")
    pourcentage = data.get("pourcentage", 0)
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO costItem (item_id, cost, id_ticket, gp, mode, pourcentage) VALUES (?, ?, ?, ?, ?, ?)', 
        (item_id, cost, ticket, gp, mode, pourcentage)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Cost added"}), 201

@app.route("/costPrix", methods=["POST"])
def add_Prix():
    data = request.get_json()
    print(f"[DEBUG costPrix] Received data: {data}")
    item_id = data.get("item_id")
    ticket = data.get("ticket_id")
    cost = data.get("cost")
    gp = data.get("gp")
    mode = data.get("mode", "1")
    pourcentage = data.get("pourcentage", 0)
    print(f"[DEBUG costPrix] Parsed => mode={mode}, pourcentage={pourcentage}, cost={cost}, ticket={ticket}")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO costItem (item_id, prix, id_ticket, gp, mode, pourcentage) VALUES (?, ?, ?, ?, ?, ?)', 
        (item_id, cost, ticket, gp, mode, pourcentage)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Prix added"}), 201
@app.route("/reinitialise", methods=["GET"])
def reinitialise():
    try:
        conn = sqlite3.connect("test.db")
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM costItem")
        
        
        conn.commit()
        cursor.close()
        conn.close() 
        
        conn_vacuum = sqlite3.connect("test.db")
        conn_vacuum.execute("VACUUM")
        conn_vacuum.close()
        return jsonify({
            "status": "success", 
            "message": "La table costItem a été réinitialisée avec succès."
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"Erreur lors de la réinitialisation : {str(e)}"
        }), 500
@app.route("/cost/<int:ticket_id>", methods=["DELETE"])
def delete(ticket_id):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute('SELECT gp FROM costItem WHERE id_ticket = ? ORDER BY gp DESC LIMIT 1', (ticket_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({"message": "No record found for this ticket"}), 404
        
    target_id = row[0]
    
    cursor.execute('DELETE FROM costItem WHERE gp = ?', (target_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Last cost record deleted successfully"}), 200

@app.route("/costLast", methods=["GET"])
def getLast():
    item = request.args.get("itemtype")
    id_ticket = request.args.get("id_ticket")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute('SELECT cost FROM costItem WHERE item_id=? and id_ticket=? ORDER BY gp DESC', (item, id_ticket))
    rows = cursor.fetchall()
    conn.close() 

    cost_list = []
    for row in rows:
        cost_list.append({
            "cost": row[0]
        })
    return jsonify(cost_list)

@app.route("/costFirst", methods=["GET"])
def getFirst():
    item = request.args.get("itemtype")
    id_ticket = request.args.get("id_ticket")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute('SELECT cost FROM costItem WHERE item_id=? and id_ticket=? ORDER BY gp ASC', (item, id_ticket))
    rows = cursor.fetchall()
    conn.close() 

    cost_list = []
    for row in rows:
        cost_list.append({
            "cost": row[0]
        })
    return jsonify(cost_list)

@app.route("/costMoyenne", methods=["GET"])
def getMoyenne():
    item = request.args.get("itemtype")
    id_ticket = request.args.get("id_ticket")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()

    # Moyenne de tous les cost par (item_id, id_ticket)
    cursor.execute(
        """
        SELECT COALESCE(AVG(cost), 0)
        FROM costItem
        WHERE item_id=? AND id_ticket=?
        """,
        (item, id_ticket)
    )
    row = cursor.fetchone()
    conn.close()

    return jsonify([{"cost": row[0] if row else 0}])

@app.route("/costSum", methods=["GET"])
def getSum():
    item = request.args.get("itemtype")
    id_ticket = request.args.get("id_ticket")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()

    # Somme de tous les cost par (item_id, id_ticket)
    cursor.execute(
        """
        SELECT COALESCE(SUM(cost), 0)
        FROM costItem
        WHERE item_id=? AND id_ticket=?
        """,
        (item, id_ticket)
    )
    row = cursor.fetchone()
    conn.close()

    return jsonify([{"cost": row[0] if row else 0}])


@app.route("/cost", methods=["GET"])
def get_cost():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute('SELECT item_id, SUM(cost), SUM(prix),gp FROM costItem GROUP BY item_id')
    rows = cursor.fetchall()
    conn.close()

    cost_list = []
    for row in rows:
        cost_list.append({
            "item_id": row[0],
            "cost": row[1],
            "prix": row[2],
            "gp": row[3]
        })
    return jsonify(cost_list)

@app.route("/status/<int:status_id>", methods=["PUT"])
def update_status(status_id):
    data = request.get_json()
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT couleur, name_fr, name_en, name_mg FROM status WHERE id = ?", (status_id,))
    current_status = cursor.fetchone()
    
    if not current_status:
        conn.close()
        return jsonify({"message": "Status not found"}), 404
        
    couleur = data.get("couleur") if data.get("couleur") else current_status[0]
    name_fr = data.get("name_fr") if data.get("name_fr") else current_status[1]
    name_en = data.get("name_en") if data.get("name_en") else current_status[2]
    name_mg = data.get("name_mg") if data.get("name_mg") else current_status[3]

    cursor.execute("""
        UPDATE status 
        SET couleur = ?, name_fr = ?, name_en = ?, name_mg = ? 
        WHERE id = ?
    """, (couleur, name_fr, name_en, name_mg, status_id))
    
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated successfully"}), 200

@app.route("/costAll", methods=["GET"])
def get_Allcost():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, item_id, cost, id_ticket, prix, mode, pourcentage, gp FROM costItem")
    rows = cursor.fetchall()
    conn.close()

    cost_list = []
    for row in rows:
        cost_list.append({
            "id": row[0],
            "item_id": row[1],
            "cost": row[2],
            "id_ticket": row[3],
            "prix": row[4],
            "mode": row[5],
            "pourcentage": row[6],
            "gp": row[7]
        })
    return jsonify(cost_list)

@app.route("/costGroup/<string:gp>", methods=["PUT"])
def update_costGroup(gp):
    data = request.get_json()
    cost = data.get("cost")
    prix = data.get("prix")
    mode = data.get("mode")
    pourcentage = data.get("pourcentage")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM costItem WHERE gp=?", (gp,))
    count = cursor.fetchone()[0]
    
    if count == 0:
        conn.close()
        return jsonify({"message": "Not found"}), 404
        
    cursor.execute("SELECT cost, prix, mode, pourcentage FROM costItem WHERE gp=? LIMIT 1", (gp,))
    row = cursor.fetchone()
    
    new_cost = (float(cost) / count) if cost is not None else row[0]
    new_prix = (float(prix) / count) if prix is not None else row[1]
    new_mode = mode if mode is not None else row[2]
    new_pourcentage = pourcentage if pourcentage is not None else row[3]
    
    cursor.execute(
        "UPDATE costItem SET cost=?, prix=?, mode=?, pourcentage=? WHERE gp=?",
        (new_cost, new_prix, new_mode, new_pourcentage, gp)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Updated successfully"}), 200

@app.route("/costGroup/<string:gp>", methods=["DELETE"])
def delete_costGroup(gp):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM costItem WHERE gp=?", (gp,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted successfully"}), 200

@app.route("/costItem/<int:id>", methods=["PUT"])
def update_costItem(id):
    data = request.get_json()
    cost = data.get("cost")
    prix = data.get("prix")
    mode = data.get("mode")
    pourcentage = data.get("pourcentage")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT cost, prix, mode, pourcentage FROM costItem WHERE id=?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"message": "Not found"}), 404
        
    new_cost = cost if cost is not None else row[0]
    new_prix = prix if prix is not None else row[1]
    new_mode = mode if mode is not None else row[2]
    new_pourcentage = pourcentage if pourcentage is not None else row[3]
    
    cursor.execute(
        "UPDATE costItem SET cost=?, prix=?, mode=?, pourcentage=? WHERE id=?",
        (new_cost, new_prix, new_mode, new_pourcentage, id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Updated successfully"}), 200

@app.route("/costItem/<int:id>", methods=["DELETE"])
def delete_costItem(id):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM costItem WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted successfully"}), 200
@app.route("/costDetails", methods=["GET"])
def get_cost_details():
    try:
        conn = sqlite3.connect("test.db")
        cursor = conn.cursor()
        
        cursor.execute('SELECT item_id, id_ticket, cost, prix FROM costItem')
        rows = cursor.fetchall()
        conn.close()

        details_list = []
        for row in rows:
            details_list.append({
                "item_id": row[0],     
                "id_ticket": row[1],    
                "cost": row[2] or 0,    
                "prix": row[3] or 0     
            })
        return jsonify(details_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(port=5000, debug=True)