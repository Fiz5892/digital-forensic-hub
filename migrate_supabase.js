// Script untuk migrasi database ke Supabase
// Jalankan dengan: node migrate_supabase.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://tabyowzzrnedlfswaimn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'; // Untuk migrasi butuh service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Memulai migrasi database ke Supabase...');

    // Baca file migration
    const migrationSQL = fs.readFileSync('./migration_supabase.sql', 'utf8');

    // Split SQL commands (berdasarkan semicolon)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    // Jalankan setiap command
    for (const command of commands) {
      if (command.trim()) {
        console.log(`Menjalankan: ${command.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: command });

        if (error) {
          console.error('Error executing command:', error);
          // Lanjutkan ke command berikutnya jika bukan error fatal
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }
    }

    console.log('Migrasi database selesai!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Jalankan migrasi
runMigration().catch(console.error);
