-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('reporter', 'first_responder', 'investigator', 'manager', 'admin')),
    department VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Website Defacement', 'SQL Injection', 'Data Breach', 'DDoS Attack', 'Malware Infection', 'Phishing', 'Unauthorized Access', 'Credential Stuffing', 'XSS Attack', 'Other')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triage', 'investigation', 'contained', 'resolved', 'closed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    assigned_to_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Tabel Impact Assessment (bagian dari incidents)
CREATE TABLE IF NOT EXISTS impact_assessments (
    incident_id VARCHAR(20) PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
    confidentiality INTEGER NOT NULL CHECK (confidentiality BETWEEN 1 AND 5),
    integrity INTEGER NOT NULL CHECK (integrity BETWEEN 1 AND 5),
    availability INTEGER NOT NULL CHECK (availability BETWEEN 1 AND 5),
    business_impact TEXT
);

-- Tabel Technical Details (bagian dari incidents)
CREATE TABLE IF NOT EXISTS technical_details (
    incident_id VARCHAR(20) PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
    target_url VARCHAR(500),
    ip_address INET,
    server_os VARCHAR(255),
    web_server VARCHAR(255),
    cms VARCHAR(255),
    "database" VARCHAR(255)
);

-- Tabel Timeline Events
CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(20) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('detection', 'report', 'assignment', 'evidence', 'analysis', 'containment', 'reporting', 'closure')),
    "user" VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Incident Notes
CREATE TABLE IF NOT EXISTS incident_notes (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(20) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('hypothesis', 'finding', 'action_item', 'question')),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Regulatory Requirements (many-to-many dengan incidents)
CREATE TABLE IF NOT EXISTS incident_regulatory_requirements (
    incident_id VARCHAR(20) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    requirement VARCHAR(255) NOT NULL,
    PRIMARY KEY (incident_id, requirement)
);

-- Tabel Evidence
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(30) PRIMARY KEY,
    incident_id VARCHAR(20) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(255),
    file_size BIGINT,
    hash_md5 VARCHAR(32),
    hash_sha256 VARCHAR(64),
    collected_by_id INTEGER NOT NULL REFERENCES users(id),
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_custodian_id INTEGER NOT NULL REFERENCES users(id),
    storage_location VARCHAR(1000),
    analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'analyzed', 'archived')),
    integrity_status VARCHAR(20) DEFAULT 'unknown' CHECK (integrity_status IN ('verified', 'tampered', 'unknown')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Custody Chain (untuk evidence)
CREATE TABLE IF NOT EXISTS custody_transfers (
    id SERIAL PRIMARY KEY,
    evidence_id VARCHAR(30) NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    from_entity VARCHAR(255) NOT NULL,
    to_entity VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    hash_verified BOOLEAN DEFAULT FALSE,
    witness VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (evidence_id, sequence)
);

-- Insert data awal dari mock data
INSERT INTO users (id, name, email, role, department) VALUES
(1, 'John Reporter', 'reporter@dfir.com', 'reporter', 'IT Support'),
(2, 'Mike Responder', 'responder@dfir.com', 'first_responder', 'SOC'),
(3, 'Sarah Investigator', 'investigator@dfir.com', 'investigator', 'Forensics'),
(4, 'Lisa Manager', 'manager@dfir.com', 'manager', 'Security'),
(5, 'Admin User', 'admin@dfir.com', 'admin', 'IT')
ON CONFLICT (id) DO NOTHING;

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_evidence_collected_by ON evidence(collected_by_id);
CREATE INDEX IF NOT EXISTS idx_timeline_incident ON timeline_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_notes_incident ON incident_notes(incident_id);

-- Views untuk reporting
CREATE OR REPLACE VIEW incident_summary AS
SELECT
    i.id,
    i.title,
    i.type,
    i.status,
    i.priority,
    u_reporter.name as reporter_name,
    u_assigned.name as assigned_name,
    i.created_at,
    i.updated_at,
    COUNT(e.id) as evidence_count
FROM incidents i
LEFT JOIN users u_reporter ON i.reporter_id = u_reporter.id
LEFT JOIN users u_assigned ON i.assigned_to_id = u_assigned.id
LEFT JOIN evidence e ON i.id = e.incident_id
GROUP BY i.id, i.title, i.type, i.status, i.priority, u_reporter.name, u_assigned.name, i.created_at, i.updated_at;

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk auto-update updated_at
DROP TRIGGER IF EXISTS update_incident_timestamp ON incidents;
CREATE TRIGGER update_incident_timestamp
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_timestamp ON users;
CREATE TRIGGER update_user_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
