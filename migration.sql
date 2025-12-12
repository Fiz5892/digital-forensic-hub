-- Migration untuk Digital Forensic Hub Database
-- Dibuat berdasarkan analisis struktur data dari aplikasi React

-- Membuat database
CREATE DATABASE IF NOT EXISTS digital_forensic_hub;
USE digital_forensic_hub;

-- Tabel Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('reporter', 'first_responder', 'investigator', 'manager', 'admin') NOT NULL,
    department VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Incidents
CREATE TABLE incidents (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type ENUM('Website Defacement', 'SQL Injection', 'Data Breach', 'DDoS Attack', 'Malware Infection', 'Phishing', 'Unauthorized Access', 'Credential Stuffing', 'XSS Attack', 'Other') NOT NULL,
    status ENUM('new', 'triage', 'investigation', 'contained', 'resolved', 'closed') NOT NULL DEFAULT 'new',
    priority ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    reporter_id INT NOT NULL,
    assigned_to_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);

-- Tabel Impact Assessment (bagian dari incidents)
CREATE TABLE impact_assessments (
    incident_id VARCHAR(20) PRIMARY KEY,
    confidentiality TINYINT NOT NULL CHECK (confidentiality BETWEEN 1 AND 5),
    integrity TINYINT NOT NULL CHECK (integrity BETWEEN 1 AND 5),
    availability TINYINT NOT NULL CHECK (availability BETWEEN 1 AND 5),
    business_impact TEXT,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

-- Tabel Technical Details (bagian dari incidents)
CREATE TABLE technical_details (
    incident_id VARCHAR(20) PRIMARY KEY,
    target_url VARCHAR(500),
    ip_address VARCHAR(45),
    server_os VARCHAR(255),
    web_server VARCHAR(255),
    cms VARCHAR(255),
    database VARCHAR(255),
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

-- Tabel Timeline Events
CREATE TABLE timeline_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    incident_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    event TEXT NOT NULL,
    type ENUM('detection', 'report', 'assignment', 'evidence', 'analysis', 'containment', 'reporting', 'closure') NOT NULL,
    user VARCHAR(255),
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

-- Tabel Incident Notes
CREATE TABLE incident_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    incident_id VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('hypothesis', 'finding', 'action_item', 'question') NOT NULL,
    created_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Tabel Regulatory Requirements (many-to-many dengan incidents)
CREATE TABLE incident_regulatory_requirements (
    incident_id VARCHAR(20) NOT NULL,
    requirement VARCHAR(255) NOT NULL,
    PRIMARY KEY (incident_id, requirement),
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

-- Tabel Evidence
CREATE TABLE evidence (
    id VARCHAR(30) PRIMARY KEY,
    incident_id VARCHAR(20) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(255),
    file_size BIGINT,
    hash_md5 VARCHAR(32),
    hash_sha256 VARCHAR(64),
    collected_by_id INT NOT NULL,
    collected_at TIMESTAMP NOT NULL,
    current_custodian_id INT NOT NULL,
    storage_location VARCHAR(1000),
    analysis_status ENUM('pending', 'analyzing', 'analyzed', 'archived') DEFAULT 'pending',
    integrity_status ENUM('verified', 'tampered', 'unknown') DEFAULT 'unknown',
    description TEXT,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by_id) REFERENCES users(id),
    FOREIGN KEY (current_custodian_id) REFERENCES users(id)
);

-- Tabel Custody Chain (untuk evidence)
CREATE TABLE custody_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evidence_id VARCHAR(30) NOT NULL,
    sequence INT NOT NULL,
    from_entity VARCHAR(255) NOT NULL,
    to_entity VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    reason TEXT,
    hash_verified BOOLEAN DEFAULT FALSE,
    witness VARCHAR(255),
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sequence (evidence_id, sequence)
);

-- Insert data awal dari mock data
INSERT INTO users (id, name, email, role, department) VALUES
(1, 'John Reporter', 'reporter@dfir.com', 'reporter', 'IT Support'),
(2, 'Mike Responder', 'responder@dfir.com', 'first_responder', 'SOC'),
(3, 'Sarah Investigator', 'investigator@dfir.com', 'investigator', 'Forensics'),
(4, 'Lisa Manager', 'manager@dfir.com', 'manager', 'Security'),
(5, 'Admin User', 'admin@dfir.com', 'admin', 'IT');

-- Insert incidents (data akan di-insert melalui aplikasi atau script terpisah)
-- Data mock incidents akan di-insert melalui aplikasi atau migration data terpisah

-- Indexes untuk performa
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX idx_incidents_assigned ON incidents(assigned_to_id);
CREATE INDEX idx_evidence_incident ON evidence(incident_id);
CREATE INDEX idx_evidence_collected_by ON evidence(collected_by_id);
CREATE INDEX idx_timeline_incident ON timeline_events(incident_id);
CREATE INDEX idx_notes_incident ON incident_notes(incident_id);

-- Views untuk reporting
CREATE VIEW incident_summary AS
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

-- Trigger untuk auto-update updated_at
DELIMITER //
CREATE TRIGGER update_incident_timestamp BEFORE UPDATE ON incidents
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
//
DELIMITER ;

DELIMITER //
CREATE TRIGGER update_user_timestamp BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
//
DELIMITER ;
