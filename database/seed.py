import os
import mysql.connector
from werkzeug.security import generate_password_hash

def get_db_connection(use_database=True):
    database = os.environ.get('DB_NAME', 'ai_finance_tracker') if use_database else None
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=database
    )

def setup_database():
    print("Connecting to MySQL to setup schema...")
    conn = get_db_connection(use_database=False)
    cursor = conn.cursor()
    
    # Read and execute schema.sql
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
        
    print("Running schema.sql...")
    for statement in schema_sql.split(';'):
        if statement.strip():
            cursor.execute(statement)
            
    conn.commit()
    cursor.close()
    conn.close()
    print("Database schema created successfully.")

def seed_data():
    print("Seeding database...")
    conn = get_db_connection(use_database=True)
    cursor = conn.cursor()
    
    # 1. Clean existing data (since we are seeding from scratch)
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    cursor.execute("TRUNCATE TABLE financial_goals;")
    cursor.execute("TRUNCATE TABLE category_budgets;")
    cursor.execute("TRUNCATE TABLE budgets;")
    cursor.execute("TRUNCATE TABLE transactions;")
    cursor.execute("TRUNCATE TABLE users;")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    
    # 2. Insert Demo User with properly hashed password
    password = 'Demo@123'
    hashed_password = generate_password_hash(password)
    print(f"Generated hash for demo user.")
    
    cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash)
        VALUES (1, 'John Doe', 'demo@example.com', %s)
    """, (hashed_password,))
    
    # 3. Read and execute rest of seed.sql (ignoring the users insert)
    seed_path = os.path.join(os.path.dirname(__file__), 'seed.sql')
    with open(seed_path, 'r', encoding='utf-8') as f:
        seed_sql = f.read()
        
    print("Running seed.sql for financial data...")
    for statement in seed_sql.split(';'):
        stmt = statement.strip()
        # Skip the user insert as we just did it via Python
        if stmt and not stmt.lower().startswith('insert into users'):
            cursor.execute(stmt)
            
    conn.commit()
    cursor.close()
    conn.close()
    print("Seed data inserted successfully.")

if __name__ == "__main__":
    try:
        setup_database()
        seed_data()
        print("Database setup and seeding completed successfully! You can now log in with demo@example.com / Demo@123")
    except Exception as e:
        print(f"An error occurred: {e}")
