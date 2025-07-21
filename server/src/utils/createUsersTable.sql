-- SQL Script to create users table in EmployeeWorkflow database

-- Check if users table exists
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    -- Create users table
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(100) NOT NULL,
        email NVARCHAR(100),
        role NVARCHAR(20) NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    )
    
    PRINT 'Users table created successfully'
END
ELSE
BEGIN
    PRINT 'Users table already exists'
END