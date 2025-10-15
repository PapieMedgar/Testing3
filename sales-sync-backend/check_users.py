import sqlite3

conn = sqlite3.connect('salesync.db')
cursor = conn.cursor()

# Check users data
cursor.execute('SELECT id, phone, role, name, password_hash FROM users')
users = cursor.fetchall()
print("Users in database:")
for user in users:
    print(f"ID: {user[0]}, Phone: {user[1]}, Role: {user[2]}, Name: {user[3]}")
    print(f"Password hash: {user[4][:50]}...")
    print()

conn.close()
