import sqlite3

def recalculate():
    conn = sqlite3.connect("MyApi/test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, item_id, id_ticket, gp, mode, pourcentage, cost, prix FROM costItem ORDER BY gp ASC")
    rows = cursor.fetchall()
    
    # Update reouvertures
    for row in rows:
        r_id, item_id, id_ticket, gp, mode, pct, cost, prix = row
        if prix > 0 or pct > 0:
            # It's a reouverture
            # Find past supercosts for this item_id and id_ticket
            cursor.execute("SELECT cost FROM costItem WHERE item_id=? AND id_ticket=? AND gp < ? AND (prix=0 AND pourcentage=0) ORDER BY gp DESC", (item_id, id_ticket, gp))
            past_costs = [c[0] for c in cursor.fetchall()]
            
            if not past_costs:
                base = 0
            else:
                mode_str = str(mode)
                if mode_str == '2':
                    base = past_costs[-1]
                elif mode_str == '3':
                    base = sum(past_costs) / len(past_costs)
                elif mode_str == '4':
                    base = sum(past_costs)
                else: # mode 1
                    base = past_costs[0]
            
            new_prix = (base * pct) / 100
            print(f"Update id {r_id}: {prix} -> {new_prix}")
            cursor.execute("UPDATE costItem SET prix=? WHERE id=?", (new_prix, r_id))
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    recalculate()
