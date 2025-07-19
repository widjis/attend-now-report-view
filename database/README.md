# MTI Attendance System - Database Migration

This directory contains scripts and tools for migrating data from the `DataDBEnt` database to the `EmployeeWorkflow` database while maintaining the same schema structure used in the MTI Attendance System.

## 📋 Overview

The migration process transfers data between two MS SQL Server databases:
- **Source**: `DataDBEnt` (existing database)
- **Target**: `EmployeeWorkflow` (new database)

### Tables Migrated:
- `CardDBTimeSchedule` - Employee schedule information
- `tblAttendanceReport` - Attendance transaction records

## 🚀 Quick Start

### Prerequisites
1. Node.js (v14 or higher)
2. Access to both source and target MS SQL Server databases
3. Appropriate database permissions (SELECT on source, CREATE/INSERT/UPDATE/DELETE on target)

### Installation
```bash
# Navigate to the database directory
cd database

# Install dependencies
npm install
```

### Configuration
1. Copy the environment template:
   ```bash
   cp .env.migration.example .env.migration
   ```

2. Edit `.env.migration` with your database credentials:
   ```env
   # Source Database (DataDBEnt)
   SOURCE_DB_USER=your_username
   SOURCE_DB_PASSWORD=your_password
   SOURCE_DB_SERVER=your_server_address
   SOURCE_DB_PORT=1433

   # Target Database (EmployeeWorkflow)
   TARGET_DB_USER=your_username
   TARGET_DB_PASSWORD=your_password
   TARGET_DB_SERVER=your_server_address
   TARGET_DB_PORT=1433
   ```

### Running the Migration
```bash
# Run the complete migration
npm run migrate

# Or run directly with Node.js
node migrate-data.js
```

### Validation
```bash
# Validate the migration results
npm run validate

# Or run directly
node validate-migration.js
```

## 📁 File Structure

```
database/
├── migrate-data.js           # Main migration script
├── validate-migration.js     # Migration validation script
├── package.json             # Dependencies and scripts
├── .env.migration.example   # Environment configuration template
├── logs/                    # Migration logs (created automatically)
└── README.md               # This file
```

## 🔧 Migration Process

The migration script performs the following steps:

1. **Connection Setup**: Establishes connections to both source and target databases
2. **Schema Validation**: Verifies source tables exist and creates target schema if needed
3. **Data Transfer**: 
   - Migrates `CardDBTimeSchedule` data (employee schedules)
   - Migrates `tblAttendanceReport` data (attendance records)
4. **Validation**: Compares record counts and validates data integrity
5. **Logging**: Creates detailed logs of the migration process

### Schema Created in Target Database

#### CardDBTimeSchedule
```sql
CREATE TABLE CardDBTimeSchedule (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    StaffNo NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Department NVARCHAR(100),
    TimeIn TIME NOT NULL,
    TimeOut TIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
```

#### tblAttendanceReport
```sql
CREATE TABLE tblAttendanceReport (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    StaffNo NVARCHAR(50) NOT NULL,
    TrDate DATE NOT NULL,
    TrDateTime DATETIME NOT NULL,
    ClockEvent NVARCHAR(20) NOT NULL CHECK (ClockEvent IN ('Clock In', 'Clock Out', 'Outside Range')),
    TrController NVARCHAR(100),
    Position NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
```

## 📊 Migration Features

### Batch Processing
- Processes data in configurable batches (default: 500 records for attendance, 100 for schedules)
- Provides progress updates during migration
- Handles large datasets efficiently

### Error Handling
- Continues processing even if individual records fail
- Logs all errors for review
- Provides detailed error messages

### Data Validation
- Verifies record counts between source and target
- Checks data integrity and consistency
- Validates sample data for accuracy

### Logging
- Creates timestamped log files in the `logs/` directory
- Tracks all migration activities and errors
- Provides detailed migration reports

## 🔍 Validation Report

The validation script provides:

### Record Count Comparison
```
┌─────────────────────┬────────────┬────────────┬──────────┐
│ Table               │ Source     │ Target     │ Status   │
├─────────────────────┼────────────┼────────────┼──────────┤
│ CardDBTimeSchedule  │ 150        │ 150        │ ✅ Match │
│ tblAttendanceReport │ 25000      │ 25000      │ ✅ Match │
└─────────────────────┴────────────┴────────────┴──────────┘
```

### Data Integrity Checks
- Duplicate record detection
- Clock event distribution analysis
- Date range validation
- Staff number consistency

## ⚠️ Important Notes

### Before Migration
1. **Backup**: Always backup your target database before running the migration
2. **Permissions**: Ensure you have appropriate database permissions
3. **Network**: Verify network connectivity to both databases
4. **Disk Space**: Ensure sufficient disk space on the target database server

### During Migration
- The migration will **clear existing data** in the target tables before inserting new data
- Large datasets may take considerable time to migrate
- Monitor the console output for progress updates

### After Migration
1. Run the validation script to verify data integrity
2. Review migration logs for any errors or warnings
3. Update your application's database connection to point to the new database
4. Test your application thoroughly with the migrated data

## 🛠️ Troubleshooting

### Common Issues

#### Connection Errors
```
❌ Database connection failed: ConnectionError: Failed to connect to server
```
**Solution**: Verify database credentials, server address, and network connectivity

#### Permission Errors
```
❌ Schema creation failed: The user does not have permission to perform this action
```
**Solution**: Ensure the database user has CREATE TABLE and ALTER permissions

#### Timeout Errors
```
❌ Request timeout
```
**Solution**: Increase timeout values or process data in smaller batches

### Environment Variables

If you're using the same server and credentials for both databases:
```env
# Simplified configuration (same server/credentials)
DB_USER=your_username
DB_PASSWORD=your_password
DB_SERVER=your_server_address
DB_PORT=1433
```

The script will use these as fallback values for both source and target connections.

## 📞 Support

For issues or questions regarding the migration process:

1. Check the migration logs in the `logs/` directory
2. Review the console output for specific error messages
3. Verify database connectivity and permissions
4. Ensure all environment variables are correctly configured

## 🔄 Re-running Migration

The migration can be safely re-run multiple times:
- Existing data in target tables will be cleared before new data is inserted
- The process is idempotent (same result each time)
- Previous migration logs are preserved with timestamps