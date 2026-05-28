"""
Load GROUND_STATIONS_DATA.csv into PostgreSQL ground_stations table.
Usage: python load_ground_stations.py
"""
import csv
import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv()

SQL_CREATE = """
CREATE TABLE IF NOT EXISTS ground_stations (
    station_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(60) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude_m DOUBLE PRECISION DEFAULT 0,
    frequency_ghz DOUBLE PRECISION DEFAULT 8.2,
    antenna_diameter_m DOUBLE PRECISION DEFAULT 10,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

SQL_INSERT = """
INSERT INTO ground_stations (station_id, name, country, latitude, longitude, altitude_m, frequency_ghz, antenna_diameter_m, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (station_id) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    altitude_m = EXCLUDED.altitude_m,
    frequency_ghz = EXCLUDED.frequency_ghz,
    antenna_diameter_m = EXCLUDED.antenna_diameter_m,
    status = EXCLUDED.status;
"""

async def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not set in .env")
        return

    conn = await asyncpg.connect(db_url)
    print("Connected to database.")

    # Create table
    await conn.execute(SQL_CREATE)
    print("Table ground_stations ready.")

    # Read CSV
    csv_path = os.path.join(os.path.dirname(__file__), "GROUND_STATIONS_DATA.csv")
    count = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            await conn.execute(
                SQL_INSERT,
                row["station_id"],
                row["name"],
                row["country"],
                float(row["latitude"]),
                float(row["longitude"]),
                float(row["altitude_m"]),
                float(row["frequency_ghz"]),
                float(row["antenna_diameter_m"]),
                row["status"],
            )
            count += 1

    print(f"Loaded {count} ground stations into database.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
