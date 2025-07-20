# Migration Schema Updates Summary

## Overview
This document summarizes the schema updates made to the migration script to align with the actual source database structure.

## Issues Identified
1. **Missing Columns**: The original migration script only included a subset of columns from the source tables
2. **Schema Mismatch**: Target schema definitions didn't match the full source table structures
3. **Data Type Inconsistencies**: Some data types in the target schema didn't align with source requirements

## Source Database Schema Analysis

### CardDBTimeSchedule Table
**Original columns in migration script**: StaffNo, Name, Department, TimeIn, TimeOut
**Actual source table columns**:
- ID (uniqueidentifier, not null)
- CardNo (varchar(16), null) 
- SiteCode (varchar(50), null)
- AccessLevel (varchar(3), null)
- Name (nvarchar(50), null)
- FirstName (nvarchar(30), null)
- LastName (nvarchar(30), null)
- StaffNo (nvarchar(100), null)
- Department (nvarchar(100), null)
- Email (nvarchar(50), null)
- TimeIn (time, null)
- TimeOut (time, null)

### tblAttendanceReport Table
**Original columns in migration script**: StaffNo, Name, Department, AttendanceDate, AttendanceTime, AttendanceType
**Actual source table columns**:
- CardNo (nvarchar(255), null)
- Name (nvarchar(255), null)
- Title (nvarchar(255), null)
- Position (nvarchar(255), null)
- Department (nvarchar(255), null)
- CardType (nvarchar(255), null)
- Gender (nvarchar(255), null)
- MaritalStatus (nvarchar(255), null)
- Company (nvarchar(255), null)
- StaffNo (nvarchar(255), null)
- TrDateTime (datetime, null)
- TrDate (datetime, null)
- dtTransaction (nvarchar(255), null)
- TrController (nvarchar(255), null)
- ClockEvent (nvarchar(255), null)
- InsertedDate (datetime, null)
- Processed (int, null)
- UnitNo (varchar(50), null)

## Changes Made

### 1. Updated Target Schema Creation
- **CardDBTimeSchedule**: Added all missing columns with appropriate data types
- **tblAttendanceReport**: Added all missing columns with appropriate data types
- Removed problematic foreign key constraint `FK_tblAttendanceReport_CardDBTimeSchedule`
- Added unique index on `StaffNo` in `CardDBTimeSchedule` for data integrity

### 2. Updated Migration Functions
- **migrateScheduleData()**: Now migrates all 12 columns instead of just 5
- **migrateAttendanceData()**: Now migrates all 18 columns instead of just 6
- Updated SQL queries to include all source columns
- Updated INSERT statements to handle all columns
- Improved error handling and logging

### 3. Data Integrity Improvements
- Changed primary filtering from `StaffNo` to `CardNo` (more reliable identifier)
- Maintained NULL value handling for optional fields
- Added comprehensive error logging for failed insertions

## Benefits of These Changes

1. **Complete Data Migration**: All source data is now preserved during migration
2. **Schema Consistency**: Target database structure matches source database
3. **Data Integrity**: Proper constraints and indexes ensure data quality
4. **Flexibility**: Full schema allows for future feature development
5. **Maintainability**: Clear column mapping makes future updates easier

## Migration Process
1. Creates target tables with complete schema
2. Migrates all CardDBTimeSchedule records with full column set
3. Migrates all tblAttendanceReport records with full column set
4. Validates record counts between source and target
5. Generates comprehensive migration logs

## Next Steps
- Test migration with actual database connectivity
- Verify data integrity after migration
- Update application code to utilize new columns as needed
- Consider adding additional indexes for performance optimization

---
*Generated on: ${new Date().toISOString()}*
*Migration Script: migrate-data.js*