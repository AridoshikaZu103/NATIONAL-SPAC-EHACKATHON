"""
Load GROUND_STATIONS_DATA.csv into PostgreSQL ground_stations table.

This is a STANDALONE script you can run manually:
    cd backend
    .\.venv\Scripts\activate
    python load_ground_stations.py

NOTE: The backend server (main.py) ALREADY loads this CSV automatically
on startup via database.py -> seed_ground_stations(). This script is
only needed if you want to reload/refresh the data manually.
"""
import csv
import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not set in .env")
        print("Add this to backend/.env:")
        print("  DATABASE_URL=postgresql://user:pass@host:5432/dbname")
        return

    print("Connecting to database...")
    conn = await asyncpg.connect(db_url)
    print("Connected!")

    # Create table (same schema as database.py and seed.sql)
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS ground_stations (
            id SERIAL PRIMARY KEY,
            station_name VARCHAR(100) UNIQUE,
            country VARCHAR(60) DEFAULT '',
            latitude FLOAT,
            longitude FLOAT,
            location VARCHAR(100),
            comm_range_km FLOAT DEFAULT 2000,
            frequency_ghz FLOAT DEFAULT 8.2,
            antenna_diameter_m FLOAT DEFAULT 10,
            status VARCHAR(20) DEFAULT 'ACTIVE'
        );
    ''')
    print("Table ground_stations ready.")

    # Read CSV (same folder as this script)
    csv_path = os.path.join(os.path.dirname(__file__), "GROUND_STATIONS_DATA.csv")
    if not os.path.exists(csv_path):
        print(f"ERROR: {csv_path} not found!")
        return

    count = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            await conn.execute('''
                INSERT INTO ground_stations
                    (station_name, country, latitude, longitude, location, comm_range_km, frequency_ghz, antenna_diameter_m, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (station_name) DO UPDATE SET
                    country = EXCLUDED.country,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    frequency_ghz = EXCLUDED.frequency_ghz,
                    antenna_diameter_m = EXCLUDED.antenna_diameter_m,
                    status = EXCLUDED.status
            ''',
                row["name"],
                row["country"],
                float(row["latitude"]),
                float(row["longitude"]),
                row["country"],
                2000.0,
                float(row["frequency_ghz"]),
                float(row["antenna_diameter_m"]),
                row["status"],
            )
            count += 1
            print(f"  [{count}] {row['name']} ({row['country']})")

    print(f"\nDone! Loaded {count} ground stations into database.")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
