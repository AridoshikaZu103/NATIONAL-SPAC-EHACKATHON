"""
Database module for Orbital Insight SSA.
Connects to Neon PostgreSQL. Seeds 40 ground stations from CSV on startup.
All tables: telemetry, maneuver_events, cdm_log, operations_log, ground_stations
"""
import os
import csv
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


class Database:
    pool = None

    @classmethod
    async def connect(cls):
        if not DATABASE_URL:
            print("WARNING: DATABASE_URL not set. Running without persistent database.")
            return
        try:
            cls.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
            print("Connected to Neon PostgreSQL.")
            await cls.create_tables()
            await cls.seed_ground_stations()
        except Exception as e:
            print(f"Failed to connect to Neon PostgreSQL: {e}")

    @classmethod
    async def create_tables(cls):
        if not cls.pool:
            return
        async with cls.pool.acquire() as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS telemetry (
                    id SERIAL PRIMARY KEY,
                    sat_id VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    lat FLOAT,
                    lon FLOAT,
                    alt FLOAT,
                    fuel_kg FLOAT
                );

                CREATE TABLE IF NOT EXISTS maneuver_events (
                    id SERIAL PRIMARY KEY,
                    event_id VARCHAR(50) UNIQUE,
                    sat_id VARCHAR(50),
                    time_start FLOAT,
                    time_end FLOAT,
                    event_type VARCHAR(20)
                );

                CREATE TABLE IF NOT EXISTS cdm_log (
                    id SERIAL PRIMARY KEY,
                    cdm_id VARCHAR(100) UNIQUE,
                    risk_level VARCHAR(10),
                    sat_name VARCHAR(50),
                    debris_id VARCHAR(50),
                    tca VARCHAR(50),
                    miss_distance_km FLOAT,
                    relative_velocity FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS operations_log (
                    id SERIAL PRIMARY KEY,
                    event_type VARCHAR(30),
                    description TEXT,
                    sim_time FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

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
            # Add new columns if they don't exist (for existing databases)
            for col, typ in [
                ("country", "VARCHAR(60) DEFAULT ''"),
                ("frequency_ghz", "FLOAT DEFAULT 8.2"),
                ("antenna_diameter_m", "FLOAT DEFAULT 10"),
            ]:
                try:
                    await conn.execute(f"ALTER TABLE ground_stations ADD COLUMN IF NOT EXISTS {col} {typ};")
                except Exception:
                    pass
            print("Database schema verified (5 tables).")

    @classmethod
    async def seed_ground_stations(cls):
        """Load 40 ground stations from GROUND_STATIONS_DATA.csv into the database."""
        if not cls.pool:
            return
        try:
            csv_path = os.path.join(os.path.dirname(__file__), "GROUND_STATIONS_DATA.csv")
            if not os.path.exists(csv_path):
                print("GROUND_STATIONS_DATA.csv not found. Skipping seed.")
                return

            async with cls.pool.acquire() as conn:
                count = 0
                with open(csv_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        await conn.execute('''
                            INSERT INTO ground_stations
                                (station_name, country, latitude, longitude, location, comm_range_km, frequency_ghz, antenna_diameter_m, status)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                            ON CONFLICT (station_name) DO NOTHING
                        ''',
                            row["name"],
                            row["country"],
                            float(row["latitude"]),
                            float(row["longitude"]),
                            row["country"],  # use country as location
                            2000.0,           # default comm range
                            float(row["frequency_ghz"]),
                            float(row["antenna_diameter_m"]),
                            row["status"],
                        )
                        count += 1
                print(f"Ground stations seeded ({count} stations).")
        except Exception as e:
            print(f"Seed error: {e}")

    @classmethod
    async def disconnect(cls):
        if cls.pool:
            await cls.pool.close()

    # ---- Logging Methods ----

    @classmethod
    async def log_telemetry(cls, sat_id, lat, lon, alt, fuel_kg):
        if not cls.pool:
            return
        try:
            async with cls.pool.acquire() as conn:
                await conn.execute(
                    'INSERT INTO telemetry (sat_id, lat, lon, alt, fuel_kg) VALUES ($1, $2, $3, $4, $5)',
                    sat_id, lat, lon, alt, fuel_kg
                )
        except Exception as e:
            print(f"DB telemetry error: {e}")

    @classmethod
    async def log_maneuver(cls, event_id, sat_id, time_start, time_end, event_type):
        if not cls.pool:
            return
        try:
            async with cls.pool.acquire() as conn:
                await conn.execute(
                    'INSERT INTO maneuver_events (event_id, sat_id, time_start, time_end, event_type) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (event_id) DO NOTHING',
                    event_id, sat_id, time_start, time_end, event_type
                )
        except Exception as e:
            print(f"DB maneuver error: {e}")

    @classmethod
    async def log_cdm(cls, cdm_id, risk, sat_name, debris_id, tca, miss_dist, rel_vel):
        if not cls.pool:
            return
        try:
            async with cls.pool.acquire() as conn:
                await conn.execute(
                    'INSERT INTO cdm_log (cdm_id, risk_level, sat_name, debris_id, tca, miss_distance_km, relative_velocity) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (cdm_id) DO NOTHING',
                    cdm_id, risk, sat_name, debris_id, tca, miss_dist, rel_vel
                )
        except Exception as e:
            print(f"DB cdm error: {e}")

    @classmethod
    async def log_operation(cls, event_type, description, sim_time):
        if not cls.pool:
            return
        try:
            async with cls.pool.acquire() as conn:
                await conn.execute(
                    'INSERT INTO operations_log (event_type, description, sim_time) VALUES ($1, $2, $3)',
                    event_type, description, sim_time
                )
        except Exception as e:
            print(f"DB ops error: {e}")

    @classmethod
    async def get_ground_stations(cls):
        """Fetch all ground stations from the database."""
        if not cls.pool:
            # Fallback: return basic data if no DB connection
            return [
                {"station_name": "IIT Delhi", "latitude": 28.54, "longitude": 77.19, "country": "India", "status": "ACTIVE"},
                {"station_name": "Svalbard", "latitude": 78.22, "longitude": 15.62, "country": "Norway", "status": "ACTIVE"},
                {"station_name": "Goldstone", "latitude": 35.42, "longitude": -116.89, "country": "USA", "status": "ACTIVE"},
                {"station_name": "Punta Arenas", "latitude": -53.15, "longitude": -70.90, "country": "Chile", "status": "ACTIVE"},
                {"station_name": "ISTRAC", "latitude": 13.03, "longitude": 77.51, "country": "India", "status": "ACTIVE"},
                {"station_name": "McMurdo", "latitude": -77.84, "longitude": 166.66, "country": "Antarctica", "status": "ACTIVE"},
            ]
        try:
            async with cls.pool.acquire() as conn:
                rows = await conn.fetch(
                    'SELECT station_name, country, latitude, longitude, location, comm_range_km, frequency_ghz, antenna_diameter_m, status FROM ground_stations ORDER BY station_name'
                )
                return [dict(r) for r in rows]
        except Exception as e:
            print(f"DB query error: {e}")
            return []
