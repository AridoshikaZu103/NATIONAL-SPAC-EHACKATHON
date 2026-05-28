-- ============================================
-- Orbital Insight SSA: Database Schema
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
    tca VARCHAR(50),
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

-- 5. Ground Station Network
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

-- Seed 40 ground stations (from GROUND_STATIONS_DATA.csv)
INSERT INTO ground_stations (station_name, country, latitude, longitude, location, comm_range_km, frequency_ghz, antenna_diameter_m) VALUES
    ('IIT Delhi',              'India',           28.54,    77.19,  'New Delhi',          2000, 8.2, 9.0),
    ('Svalbard SvalSat',       'Norway',          78.22,    15.62,  'Svalbard Arctic',    2500, 8.4, 13.0),
    ('Goldstone DSN',          'USA',             35.42,  -116.89,  'California',         2200, 8.4, 70.0),
    ('Punta Arenas',           'Chile',          -53.15,   -70.90,  'Southern Chile',     2000, 8.2, 9.0),
    ('ISTRAC Bangalore',       'India',           13.03,    77.51,  'Bangalore',          2000, 8.4, 11.0),
    ('McMurdo Station',        'Antarctica',     -77.84,   166.66,  'McMurdo',            2500, 8.2, 10.0),
    ('Canberra DSN',           'Australia',      -35.40,   148.98,  'Canberra',           2200, 8.4, 70.0),
    ('Madrid DSN',             'Spain',           40.43,    -4.25,  'Madrid',             2200, 8.4, 70.0),
    ('Weilheim',               'Germany',         47.88,    11.07,  'Bavaria',            2000, 8.2, 15.0),
    ('Kiruna ESTRACK',         'Sweden',          67.86,    20.96,  'Kiruna',             2000, 8.4, 15.0),
    ('Maspalomas',             'Spain',           27.76,   -15.63,  'Canary Islands',     2000, 8.2, 15.0),
    ('Kourou ESTRACK',         'French Guiana',    5.24,   -52.77,  'Kourou',             2000, 8.4, 15.0),
    ('Malindi',                'Kenya',           -2.99,    40.19,  'Malindi Coast',      2000, 8.2, 10.0),
    ('Perth ESTRACK',          'Australia',      -31.80,   115.88,  'Perth',              2000, 8.4, 15.0),
    ('Villafranca',            'Spain',           40.44,    -3.95,  'Madrid Region',      2000, 8.2, 15.0),
    ('Redu ESTRACK',           'Belgium',         50.00,     5.15,  'Redu',               2000, 8.4, 15.0),
    ('New Norcia',             'Australia',      -31.05,   116.19,  'Western Australia',  2000, 8.4, 35.0),
    ('Cebreros',               'Spain',           40.45,    -4.37,  'Avila',              2000, 8.4, 35.0),
    ('Malargue',               'Argentina',      -35.78,   -69.39,  'Mendoza',            2000, 8.4, 35.0),
    ('Troll Station',          'Antarctica',     -72.01,     2.53,  'Queen Maud Land',    2500, 8.2, 7.3),
    ('Sriharikota ISRO',       'India',           13.72,    80.23,  'Andhra Pradesh',     2000, 8.4, 18.0),
    ('Lucknow ISRO',           'India',           26.91,    80.95,  'Uttar Pradesh',      2000, 8.2, 11.0),
    ('Port Blair ISRO',        'India',           11.62,    92.72,  'Andaman Islands',    2000, 8.2, 7.5),
    ('Thiruvananthapuram ISRO','India',            8.52,    76.93,  'Kerala',             2000, 8.2, 11.0),
    ('Biak Indonesia',         'Indonesia',       -1.17,   136.10,  'Papua',              2000, 8.2, 9.0),
    ('Dongara SSTL',           'Australia',      -29.25,   114.93,  'Western Australia',  2000, 8.4, 7.3),
    ('Hartebeesthoek',         'South Africa',   -25.89,    27.69,  'Gauteng',            2000, 8.4, 15.0),
    ('Usuda JAXA',             'Japan',           36.13,   138.36,  'Nagano',             2000, 8.4, 64.0),
    ('Sagamihara JAXA',        'Japan',           35.56,   139.40,  'Kanagawa',           2000, 8.2, 10.0),
    ('Kashima JAXA',           'Japan',           35.96,   140.66,  'Ibaraki',            2000, 8.4, 34.0),
    ('Beijing CNSA',           'China',           39.90,   116.40,  'Beijing',            2000, 8.4, 18.0),
    ('Jiamusi CNSA',           'China',           46.80,   130.36,  'Heilongjiang',       2000, 8.4, 18.0),
    ('Kashi CNSA',             'China',           39.47,    75.99,  'Xinjiang',           2000, 8.4, 35.0),
    ('Santiago CNSA',          'Chile',          -33.15,   -70.67,  'Santiago',            2000, 8.4, 18.0),
    ('Namibia CNSA',           'Namibia',        -22.57,    17.08,  'Swakopmund',         2000, 8.4, 18.0),
    ('Fairbanks Alaska',       'USA',             64.86,  -147.85,  'Alaska',             2000, 8.2, 11.0),
    ('Wallops Island',         'USA',             37.94,   -75.46,  'Virginia',           2000, 8.4, 18.0),
    ('White Sands',            'USA',             32.35,  -106.37,  'New Mexico',         2000, 8.4, 18.0),
    ('Poker Flat',             'USA',             65.13,  -147.47,  'Alaska',             2000, 8.2, 9.0),
    ('Tromso',                 'Norway',          69.66,    18.94,  'Northern Norway',    2000, 8.4, 13.0)
ON CONFLICT (station_name) DO NOTHING;
