import sqlite3

# Create database manually
conn = sqlite3.connect('salesync.db')
cursor = conn.cursor()

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    manager_id INTEGER,
    FOREIGN KEY (manager_id) REFERENCES users(id)
)
''')

# Create shops table
cursor.execute('''
CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
)
''')

# Create checkins table
cursor.execute('''
CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    shop_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    photo_path VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (agent_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES shops(id)
)
''')

# Create visit_responses table
cursor.execute('''
CREATE TABLE IF NOT EXISTS visit_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_id INTEGER NOT NULL,
    visit_type TEXT NOT NULL,
    responses TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE,
    UNIQUE (checkin_id)
)
''')

# Create indexes
cursor.execute('CREATE INDEX IF NOT EXISTS idx_visit_responses_visit_type ON visit_responses(visit_type)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_visit_responses_created_at ON visit_responses(created_at)')

conn.commit()

# Check what was created
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Created tables:")
for table in tables:
    print(f"  - {table[0]}")

print("\nDatabase created successfully!")
conn.close()
