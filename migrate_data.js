// Script untuk migrasi data dari mock data ke database
// Jalankan setelah migration.sql dijalankan

const mysql = require('mysql2/promise');
const { mockIncidents, mockEvidence } = require('./src/lib/mockData');

async function migrateData() {
  // Konfigurasi koneksi database
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'digital_forensic_hub'
  });

  try {
    console.log('Memulai migrasi data...');

    // Insert incidents
    for (const incident of mockIncidents) {
      // Insert incident
      await connection.execute(`
        INSERT INTO incidents (id, title, description, type, status, priority, reporter_id, assigned_to_id, created_at, updated_at, closed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        incident.id,
        incident.title,
        incident.description,
        incident.type,
        incident.status,
        incident.priority,
        incident.reporter.id,
        incident.assigned_to?.id || null,
        new Date(incident.created_at),
        new Date(incident.updated_at),
        incident.closed_at ? new Date(incident.closed_at) : null
      ]);

      // Insert impact assessment
      await connection.execute(`
        INSERT INTO impact_assessments (incident_id, confidentiality, integrity, availability, business_impact)
        VALUES (?, ?, ?, ?, ?)
      `, [
        incident.id,
        incident.impact_assessment.confidentiality,
        incident.impact_assessment.integrity,
        incident.impact_assessment.availability,
        incident.impact_assessment.business_impact
      ]);

      // Insert technical details
      await connection.execute(`
        INSERT INTO technical_details (incident_id, target_url, ip_address, server_os, web_server, cms, \`database\`)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        incident.id,
        incident.technical_details.target_url,
        incident.technical_details.ip_address,
        incident.technical_details.server_os,
        incident.technical_details.web_server,
        incident.technical_details.cms,
        incident.technical_details.database
      ]);

      // Insert timeline events
      for (const event of incident.timeline) {
        await connection.execute(`
          INSERT INTO timeline_events (incident_id, timestamp, event, type, \`user\`)
          VALUES (?, ?, ?, ?, ?)
        `, [
          incident.id,
          new Date(event.timestamp),
          event.event,
          event.type,
          event.user || null
        ]);
      }

      // Insert notes
      for (const note of incident.notes) {
        await connection.execute(`
          INSERT INTO incident_notes (incident_id, content, category, created_by_id, created_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          incident.id,
          note.content,
          note.category,
          note.created_by.id,
          new Date(note.created_at)
        ]);
      }

      // Insert regulatory requirements
      for (const req of incident.regulatory_requirements) {
        await connection.execute(`
          INSERT INTO incident_regulatory_requirements (incident_id, requirement)
          VALUES (?, ?)
        `, [incident.id, req]);
      }
    }

    // Insert evidence
    for (const evidence of mockEvidence) {
      // Insert evidence
      await connection.execute(`
        INSERT INTO evidence (id, incident_id, filename, file_type, file_size, hash_md5, hash_sha256, collected_by_id, collected_at, current_custodian_id, storage_location, analysis_status, integrity_status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evidence.id,
        evidence.incident_id,
        evidence.filename,
        evidence.file_type,
        evidence.file_size,
        evidence.hash_md5,
        evidence.hash_sha256,
        evidence.collected_by.id,
        new Date(evidence.collected_at),
        evidence.current_custodian.id,
        evidence.storage_location,
        evidence.analysis_status,
        evidence.integrity_status,
        evidence.description || null
      ]);

      // Insert custody chain
      for (const transfer of evidence.custody_chain) {
        await connection.execute(`
          INSERT INTO custody_transfers (evidence_id, sequence, from_entity, to_entity, timestamp, reason, hash_verified, witness)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          evidence.id,
          transfer.sequence,
          transfer.from,
          transfer.to,
          new Date(transfer.timestamp),
          transfer.reason,
          transfer.hash_verified,
          transfer.witness || null
        ]);
      }
    }

    console.log('Migrasi data selesai!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await connection.end();
  }
}

// Jalankan migrasi
migrateData().catch(console.error);
