const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        colorLog(`✅ Created directory: ${dirPath}`, 'green');
        return true;
    }
    return false;
}

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

function main() {
    colorLog('╔══════════════════════════════════════════════════════════════╗', 'cyan');
    colorLog('║           MTI Attendance System - Setup Check               ║', 'cyan');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'cyan');
    console.log();

    const baseDir = __dirname;
    const logsDir = path.join(baseDir, 'logs');
    
    // Ensure logs directory exists
    colorLog('📁 Checking directories...', 'bright');
    const logsCreated = ensureDirectoryExists(logsDir);
    if (!logsCreated) {
        colorLog(`✅ Logs directory already exists: ${logsDir}`, 'blue');
    }
    
    console.log();
    
    // Check required files
    colorLog('📄 Checking required files...', 'bright');
    const requiredFiles = [
        'migrate-data.js',
        'validate-migration.js',
        'migration-tool.js',
        'package.json',
        '.env.migration.example',
        'README.md'
    ];
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
        const filePath = path.join(baseDir, file);
        if (checkFileExists(filePath)) {
            colorLog(`✅ ${file}`, 'green');
        } else {
            colorLog(`❌ ${file} - MISSING`, 'red');
            allFilesExist = false;
        }
    });
    
    console.log();
    
    // Check optional files
    colorLog('🔧 Checking configuration...', 'bright');
    const envPath = path.join(baseDir, '.env.migration');
    if (checkFileExists(envPath)) {
        colorLog('✅ .env.migration - Configuration ready', 'green');
    } else {
        colorLog('⚠️  .env.migration - Not configured yet', 'yellow');
        colorLog('   Run the migration tool to setup configuration', 'yellow');
    }
    
    console.log();
    
    // Check dependencies
    colorLog('📦 Checking dependencies...', 'bright');
    const nodeModulesPath = path.join(baseDir, 'node_modules');
    if (checkFileExists(nodeModulesPath)) {
        colorLog('✅ node_modules - Dependencies installed', 'green');
    } else {
        colorLog('⚠️  node_modules - Dependencies not installed', 'yellow');
        colorLog('   Run: npm install', 'yellow');
    }
    
    console.log();
    
    // Summary and next steps
    if (allFilesExist) {
        colorLog('🎉 Setup Check Complete!', 'bright');
        colorLog('═'.repeat(50), 'cyan');
        
        colorLog('\n📋 Next Steps:', 'bright');
        colorLog('1. Install dependencies (if not done):', 'blue');
        colorLog('   npm install', 'cyan');
        
        colorLog('\n2. Run the migration tool:', 'blue');
        colorLog('   npm start', 'cyan');
        colorLog('   OR', 'yellow');
        colorLog('   node migration-tool.js', 'cyan');
        colorLog('   OR (Windows)', 'yellow');
        colorLog('   run-migration.bat', 'cyan');
        
        colorLog('\n3. Follow the interactive prompts to:', 'blue');
        colorLog('   • Setup database configuration', 'cyan');
        colorLog('   • Run the migration', 'cyan');
        colorLog('   • Validate results', 'cyan');
        
        colorLog('\n📚 Documentation:', 'blue');
        colorLog('   See README.md for detailed instructions', 'cyan');
        
    } else {
        colorLog('❌ Setup Incomplete!', 'red');
        colorLog('Some required files are missing. Please ensure all migration files are present.', 'yellow');
    }
    
    console.log();
}

main();