import os
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
            print("Successfully connected to Vercel/Neon PostgreSQL.")
            await cls.create_tables()
        except Exception as e:
            print(f"Failed to connect to Neon PostgreSQL: {e}")

    @classmethod
    async def create_tables(cls):
        if not cls.pool: return
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
            ''')
            print("Database schema verified.")

    @classmethod
    async def disconnect(cls):
        if cls.pool:
            await cls.pool.close()

    @classmethod
    async def log_telemetry(cls, sat_id: str, lat: float, lon: float, alt: float, fuel_kg: float):
        if not cls.pool: return
        try:
            async with cls.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO telemetry (sat_id, lat, lon, alt, fuel_kg)
                    VALUES ($1, $2, $3, $4, $5)
                ''', sat_id, lat, lon, alt, fuel_kg)
        except Exception as e:
            print(f"DB Insert Error: {e}")

    @classmethod
    async def log_maneuver(cls, event_id: str, sat_id: str, time_start: float, time_end: float, event_type: str):
        if not cls.pool: return
        try:
            async with cls.pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO maneuver_events (event_id, sat_id, time_start, time_end, event_type)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (event_id) DO NOTHING
                ''', event_id, sat_id, time_start, time_end, event_type)
        except Exception as e:
            print(f"DB Insert Error: {e}")
