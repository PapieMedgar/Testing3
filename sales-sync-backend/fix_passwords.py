from run import app
from app import bcrypt
import sqlite3

with app.app_context():
    # Generate proper password hashes
    admin_hash = bcrypt.generate_password_hash('admin123').decode('utf-8')
    manager_hash = bcrypt.generate_password_hash('manager123').decode('utf-8')
    agent_hash = bcrypt.generate_password_hash('agent123').decode('utf-8')
    
    print("Generated hashes:")
    print(f"Admin: {admin_hash}")
    print(f"Manager: {manager_hash}")
    print(f"Agent: {agent_hash}")
    
    # Update database with correct hashes
    conn = sqlite3.connect('salesync.db')
    cursor = conn.cursor()
    
    cursor.execute('UPDATE users SET password_hash = ? WHERE phone = ?', (admin_hash, '1234567890'))
    cursor.execute('UPDATE users SET password_hash = ? WHERE phone = ?', (manager_hash, '1234567891'))
    cursor.execute('UPDATE users SET password_hash = ? WHERE phone = ?', (agent_hash, '1234567892'))
    
    conn.commit()
    conn.close()
    
    print("Password hashes updated successfully!")
