import sqlite3

# Create sample data
conn = sqlite3.connect('salesync.db')
cursor = conn.cursor()

# Create an admin user
admin_password = '$2b$12$Us5CxfCErac3QppT2Rb3tu3L2TNlPl4bv234/3OBydVvGcewiV5w2'
cursor.execute('''
INSERT OR IGNORE INTO users (phone, password_hash, role, name, is_active) 
VALUES ('1234567890', ?, 'ADMIN', 'Admin User', 1)
''', (admin_password,))

# Create a manager
manager_password = '$2b$12$WrJj3/Xax09A29IaIvSGCe9xxTlKKXT9EOxZIF.A52n740N9e.3n.'
cursor.execute('''
INSERT OR IGNORE INTO users (phone, password_hash, role, name, is_active) 
VALUES ('1234567891', ?, 'MANAGER', 'Test Manager', 1)
''', (manager_password,))

# Get manager ID
cursor.execute('SELECT id FROM users WHERE role = "MANAGER" LIMIT 1')
manager_row = cursor.fetchone()
if manager_row:
    manager_id = manager_row[0]
else:
    manager_id = None

# Create an agent
agent_password = '$2b$12$KLneUCEYDfHkNI7U8PWDHeXK7qRPZYNveTpeAVT3ao71QIcgUKdv.'
cursor.execute('''
INSERT OR IGNORE INTO users (phone, password_hash, role, name, is_active, manager_id) 
VALUES ('1234567892', ?, 'AGENT', 'Test Agent', 1, ?)
''', (agent_password, manager_id))

# Create some shops
shops_data = [
    ('Super Store', '123 Main St, Johannesburg', -26.2041, 28.0473),
    ('Corner Shop', '456 Side Ave, Pretoria', -25.7461, 28.1881),
    ('Mini Market', '789 High St, Durban', -29.8587, 31.0218),
]

for shop in shops_data:
    cursor.execute('''
    INSERT OR IGNORE INTO shops (name, address, latitude, longitude)
    VALUES (?, ?, ?, ?)
    ''', shop)

conn.commit()

# Show created data
print("Created sample data:")
print("\nUsers:")
cursor.execute('SELECT phone, role, name FROM users')
for user in cursor.fetchall():
    print(f"  {user[0]} - {user[1]} - {user[2]}")

print("\nShops:")
cursor.execute('SELECT name, address FROM shops')
for shop in cursor.fetchall():
    print(f"  {shop[0]} - {shop[1]}")

print("\nLogin credentials:")
print("  Admin: 1234567890 / admin123")
print("  Manager: 1234567891 / manager123")
print("  Agent: 1234567892 / agent123")

conn.close()
