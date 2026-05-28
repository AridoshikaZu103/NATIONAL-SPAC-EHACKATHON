-- ============================================
-- Project AETHER: Database Schema (Neon PostgreSQL)
-- National Space Hackathon 2026
-- ============================================

-- 1. Satellite telemetry snapshots
CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    sat_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lat FLOAT,
    lon FLOAT,
    alt FLOAT,
    fuel_kg FLOAT
);

-- 2. Maneuver events (evasion + recovery burns)
CREATE TABLE IF NOT EXISTS maneuver_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE,
    sat_id VARCHAR(50),
    time_start FLOAT,
    time_end FLOAT,
    event_type VARCHAR(20) -- EVASION | RECOVERY
);

-- 3. Conjunction Data Messages (CDM) log
CREATE TABLE IF NOT EXISTS cdm_log (
    id SERIAL PRIMARY KEY,
    cdm_id VARCHAR(100) UNIQUE,
    risk_level VARCHAR(10),        -- RED | YELLOW | GREEN
    sat_name VARCHAR(50),
    debris_id VARCHAR(50),
    tca VARCHAR(50),               -- Time of Closest Approach (ISO string)
    miss_distance_km FLOAT,
    relative_velocity FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Operations log (audit trail)
CREATE TABLE IF NOT EXISTS operations_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(30),        -- STEP | THREAT_DETECTED | EVASION_FIRED | COLLISION_AVOIDED
    description TEXT,
    sim_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ground Station Network (static reference data)
CREATE TABLE IF NOT EXISTS ground_stations (
    id SERIAL PRIMARY KEY,
    station_name VARCHAR(100) UNIQUE,
    latitude FLOAT,
    longitude FLOAT,
    location VARCHAR(100),
    comm_range_km FLOAT DEFAULT 2000,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Seed ground stations
INSERT INTO ground_stations (station_name, latitude, longitude, location, comm_range_km) VALUES
    ('IIT Delhi',     28.54,  77.19,   'New Delhi, India',       2000),
    ('Svalbard',      78.22,  15.62,   'Svalbard, Norway',       2500),
    ('Goldstone',     35.42, -116.89,  'California, USA',        2200),
    ('Punta Arenas', -53.15, -70.90,   'Punta Arenas, Chile',    2000),
    ('ISTRAC',        13.03,  77.51,   'Bangalore, India',       2000),
    ('McMurdo',      -77.84,  166.66,  'McMurdo, Antarctica',    2500)
ON CONFLICT (station_name) DO NOTHING;
