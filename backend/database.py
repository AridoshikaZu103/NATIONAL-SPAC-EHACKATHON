import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

GROUND_STATIONS_DATA = [
    ("IIT Delhi", 28.54, 77.19, "New Delhi, India", 2000),
    ("Svalbard", 78.22, 15.62, "Svalbard, Norway", 2500),
    ("Goldstone", 35.42, -116.89, "California, USA", 2200),
    ("Punta Arenas", -53.15, -70.90, "Punta Arenas, Chile", 2000),
    ("ISTRAC", 13.03, 77.51, "Bangalore, India", 2000),
    ("McMurdo", -77.84, 166.66, "McMurdo, Antarctica", 2500),
]

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
                    latitude FLOAT,
                    longitude FLOAT,
                    location VARCHAR(100),
                    comm_range_km FLOAT DEFAULT 2000,
                    status VARCHAR(20) DEFAULT 'ACTIVE'
                );
            ''')
            print("Database schema verified (5 tables).")

    @classmethod
    async def seed_ground_stations(cls):
        if not cls.pool:
            return
        try:
            async with cls.pool.acquire() as conn:
                for name, lat, lon, loc, rng in GROUND_STATIONS_DATA:
                    await conn.execute('''
                        INSERT INTO ground_stations (station_name, latitude, longitude, location, comm_range_km)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (station_name) DO NOTHING
                    ''', name, lat, lon, loc, float(rng))
                print("Ground stations seeded.")
        except Exception as e:
            print(f"Seed error: {e}")

    @classmethod
    async def disconnect(cls):
        if cls.pool:
            await cls.pool.close()

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
        if not cls.pool:
            return GROUND_STATIONS_DATA
        try:
            async with cls.pool.acquire() as conn:
                rows = await conn.fetch('SELECT station_name, latitude, longitude, location, comm_range_km, status FROM ground_stations')
                return [dict(r) for r in rows]
        except Exception as e:
            print(f"DB query error: {e}")
            return []
