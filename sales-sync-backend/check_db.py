import sqlite3
import os

# Check if database file exists
db_path = 'salesync.db'
print(f"Database file exists: {os.path.exists(db_path)}")
print(f"Database file size: {os.path.getsize(db_path) if os.path.exists(db_path) else 'N/A'} bytes")

conn = sqlite3.connect('salesync.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Existing tables:")
for table in tables:
    print(f"  - {table[0]}")

if not tables:
    print("No tables found - database is empty")

conn.close()
