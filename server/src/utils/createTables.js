const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function createTables() {
    try {
        // Read the SQL script
        const sqlScript = fs.readFileSync(
            path.join(__dirname, 'createReportTables.sql'),
            'utf8'
        );

        // Connect to database
        console.log('Connecting to database...');
        await sql.connect(config);

        // Execute the script
        console.log('Creating tables...');
        await sql.query(sqlScript);

        console.log('Tables created successfully!');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await sql.close();
    }
}

createTables();