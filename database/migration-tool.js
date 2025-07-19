#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader() {
    console.clear();
    colorLog('╔══════════════════════════════════════════════════════════════╗', 'cyan');
    colorLog('║                MTI Attendance System                         ║', 'cyan');
    colorLog('║                Database Migration Tool                       ║', 'cyan');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'cyan');
    console.log();
}

function printMenu() {
    colorLog('Available Options:', 'bright');
    colorLog('1. 🔧 Setup Environment Configuration', 'blue');
    colorLog('2. 🚀 Run Migration (DataDBEnt → EmployeeWorkflow)', 'green');
    colorLog('3. 🔍 Validate Migration Results', 'yellow');
    colorLog('4. 📋 View Migration Logs', 'magenta');
    colorLog('5. ❌ Exit', 'red');
    console.log();
}

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setupEnvironment() {
    colorLog('\n🔧 Environment Configuration Setup', 'bright');
    colorLog('═'.repeat(50), 'cyan');
    
    const envPath = path.join(__dirname, '.env.migration');
    const examplePath = path.join(__dirname, '.env.migration.example');
    
    if (fs.existsSync(envPath)) {
        const overwrite = await askQuestion('Environment file already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            colorLog('Setup cancelled.', 'yellow');
            return;
        }
    }
    
    if (!fs.existsSync(examplePath)) {
        colorLog('❌ .env.migration.example not found!', 'red');
        return;
    }
    
    colorLog('\nPlease provide the following database information:', 'bright');
    
    // Source database configuration
    colorLog('\n📊 Source Database (DataDBEnt):', 'blue');
    const sourceUser = await askQuestion('Username: ');
    const sourcePassword = await askQuestion('Password: ');
    const sourceServer = await askQuestion('Server (e.g., localhost or IP): ');
    const sourcePort = await askQuestion('Port (default 1433): ') || '1433';
    
    // Target database configuration
    colorLog('\n🎯 Target Database (EmployeeWorkflow):', 'green');
    const sameCredentials = await askQuestion('Use same credentials as source? (Y/n): ');
    
    let targetUser, targetPassword, targetServer, targetPort;
    
    if (sameCredentials.toLowerCase() === 'n') {
        targetUser = await askQuestion('Username: ');
        targetPassword = await askQuestion('Password: ');
        targetServer = await askQuestion('Server (e.g., localhost or IP): ');
        targetPort = await askQuestion('Port (default 1433): ') || '1433';
    } else {
        targetUser = sourceUser;
        targetPassword = sourcePassword;
        targetServer = sourceServer;
        targetPort = sourcePort;
    }
    
    // Migration settings
    colorLog('\n⚙️ Migration Settings:', 'magenta');
    const batchSize = await askQuestion('Batch size for attendance records (default 500): ') || '500';
    const scheduleBatchSize = await askQuestion('Batch size for schedule records (default 100): ') || '100';
    const logLevel = await askQuestion('Log level (info/debug/error, default info): ') || 'info';
    
    // Create environment file
    const envContent = `# MTI Attendance System - Database Migration Configuration
# Generated on ${new Date().toISOString()}

# Source Database (DataDBEnt)
SOURCE_DB_USER=${sourceUser}
SOURCE_DB_PASSWORD=${sourcePassword}
SOURCE_DB_SERVER=${sourceServer}
SOURCE_DB_NAME=DataDBEnt
SOURCE_DB_PORT=${sourcePort}

# Target Database (EmployeeWorkflow)
TARGET_DB_USER=${targetUser}
TARGET_DB_PASSWORD=${targetPassword}
TARGET_DB_SERVER=${targetServer}
TARGET_DB_NAME=EmployeeWorkflow
TARGET_DB_PORT=${targetPort}

# Migration Settings
BATCH_SIZE=${batchSize}
SCHEDULE_BATCH_SIZE=${scheduleBatchSize}
LOG_LEVEL=${logLevel}

# Connection Settings
CONNECTION_TIMEOUT=30000
REQUEST_TIMEOUT=60000
ENCRYPT=true
TRUST_SERVER_CERTIFICATE=true
`;
    
    try {
        fs.writeFileSync(envPath, envContent);
        colorLog('\n✅ Environment configuration saved successfully!', 'green');
        colorLog(`📁 Configuration saved to: ${envPath}`, 'blue');
    } catch (error) {
        colorLog(`❌ Failed to save configuration: ${error.message}`, 'red');
    }
}

async function runMigration() {
    colorLog('\n🚀 Starting Database Migration', 'bright');
    colorLog('═'.repeat(50), 'cyan');
    
    const envPath = path.join(__dirname, '.env.migration');
    if (!fs.existsSync(envPath)) {
        colorLog('❌ Environment configuration not found!', 'red');
        colorLog('Please run option 1 to setup environment first.', 'yellow');
        return;
    }
    
    colorLog('⚠️  WARNING: This will clear existing data in the target database!', 'yellow');
    const confirm = await askQuestion('Are you sure you want to continue? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y') {
        colorLog('Migration cancelled.', 'yellow');
        return;
    }
    
    colorLog('\n🔄 Running migration script...', 'blue');
    
    try {
        const { spawn } = require('child_process');
        const migrationProcess = spawn('node', ['migrate-data.js'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        migrationProcess.on('close', (code) => {
            if (code === 0) {
                colorLog('\n✅ Migration completed successfully!', 'green');
            } else {
                colorLog(`\n❌ Migration failed with exit code: ${code}`, 'red');
            }
        });
        
        migrationProcess.on('error', (error) => {
            colorLog(`❌ Failed to start migration: ${error.message}`, 'red');
        });
        
    } catch (error) {
        colorLog(`❌ Error running migration: ${error.message}`, 'red');
    }
}

async function validateMigration() {
    colorLog('\n🔍 Validating Migration Results', 'bright');
    colorLog('═'.repeat(50), 'cyan');
    
    const envPath = path.join(__dirname, '.env.migration');
    if (!fs.existsSync(envPath)) {
        colorLog('❌ Environment configuration not found!', 'red');
        colorLog('Please run option 1 to setup environment first.', 'yellow');
        return;
    }
    
    colorLog('🔄 Running validation script...', 'blue');
    
    try {
        const { spawn } = require('child_process');
        const validationProcess = spawn('node', ['validate-migration.js'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        validationProcess.on('close', (code) => {
            if (code === 0) {
                colorLog('\n✅ Validation completed!', 'green');
            } else {
                colorLog(`\n❌ Validation failed with exit code: ${code}`, 'red');
            }
        });
        
        validationProcess.on('error', (error) => {
            colorLog(`❌ Failed to start validation: ${error.message}`, 'red');
        });
        
    } catch (error) {
        colorLog(`❌ Error running validation: ${error.message}`, 'red');
    }
}

async function viewLogs() {
    colorLog('\n📋 Migration Logs', 'bright');
    colorLog('═'.repeat(50), 'cyan');
    
    const logsDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logsDir)) {
        colorLog('📁 No logs directory found.', 'yellow');
        return;
    }
    
    const logFiles = fs.readdirSync(logsDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Sort by newest first
    
    if (logFiles.length === 0) {
        colorLog('📄 No log files found.', 'yellow');
        return;
    }
    
    colorLog('Available log files:', 'blue');
    logFiles.forEach((file, index) => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        colorLog(`${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toLocaleString()})`, 'cyan');
    });
    
    const choice = await askQuestion('\nEnter log file number to view (or press Enter to cancel): ');
    const fileIndex = parseInt(choice) - 1;
    
    if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= logFiles.length) {
        colorLog('Cancelled.', 'yellow');
        return;
    }
    
    const selectedFile = logFiles[fileIndex];
    const logPath = path.join(logsDir, selectedFile);
    
    try {
        const logContent = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        
        colorLog(`\n📄 Log File: ${selectedFile}`, 'bright');
        colorLog('─'.repeat(50), 'cyan');
        
        colorLog(`Start Time: ${logContent.startTime}`, 'blue');
        colorLog(`End Time: ${logContent.endTime || 'In Progress'}`, 'blue');
        colorLog(`Status: ${logContent.status}`, logContent.status === 'completed' ? 'green' : 'red');
        
        if (logContent.summary) {
            colorLog('\nSummary:', 'bright');
            Object.entries(logContent.summary).forEach(([key, value]) => {
                colorLog(`  ${key}: ${value}`, 'cyan');
            });
        }
        
        if (logContent.errors && logContent.errors.length > 0) {
            colorLog('\nErrors:', 'red');
            logContent.errors.forEach((error, index) => {
                colorLog(`  ${index + 1}. ${error}`, 'red');
            });
        }
        
    } catch (error) {
        colorLog(`❌ Failed to read log file: ${error.message}`, 'red');
    }
}

async function main() {
    printHeader();
    
    while (true) {
        printMenu();
        const choice = await askQuestion('Select an option (1-5): ');
        
        switch (choice) {
            case '1':
                await setupEnvironment();
                break;
            case '2':
                await runMigration();
                break;
            case '3':
                await validateMigration();
                break;
            case '4':
                await viewLogs();
                break;
            case '5':
                colorLog('\n👋 Goodbye!', 'green');
                rl.close();
                process.exit(0);
                break;
            default:
                colorLog('❌ Invalid option. Please select 1-5.', 'red');
        }
        
        console.log();
        await askQuestion('Press Enter to continue...');
        printHeader();
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    colorLog('\n\n👋 Migration tool interrupted. Goodbye!', 'yellow');
    rl.close();
    process.exit(0);
});

// Start the application
main().catch((error) => {
    colorLog(`❌ Unexpected error: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
});