USE [EmployeeWorkflow]

-- Create tblReportGenerationLog if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tblReportGenerationLog](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ReportType] [nvarchar](50) NOT NULL,
        [StartDate] [datetime] NOT NULL,
        [EndDate] [datetime] NOT NULL,
        [RecordsProcessed] [int] NULL,
        [RecordsInserted] [int] NULL,
        [RecordsSkipped] [int] NULL,
        [Parameters] [nvarchar](max) NULL,
        [Status] [nvarchar](20) NOT NULL,
        [ErrorMessage] [nvarchar](max) NULL,
        [ExecutionTimeMs] [int] NULL,
        [CreatedBy] [nvarchar](50) NULL,
        [GeneratedAt] [datetime] NOT NULL DEFAULT GETDATE(),
        [CompletedAt] [datetime] NULL,
        [FilePath] [nvarchar](500) NULL,
        [WhatsAppStatus] [nvarchar](20) NULL,
        [WhatsAppSentAt] [datetime] NULL,
        [WhatsAppError] [nvarchar](max) NULL,
        CONSTRAINT [PK_tblReportGenerationLog] PRIMARY KEY CLUSTERED ([Id] ASC)
    )
END
ELSE
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'RecordsProcessed')
        ALTER TABLE [dbo].[tblReportGenerationLog] ADD [RecordsProcessed] [int] NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'RecordsInserted')
        ALTER TABLE [dbo].[tblReportGenerationLog] ADD [RecordsInserted] [int] NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'RecordsSkipped')
        ALTER TABLE [dbo].[tblReportGenerationLog] ADD [RecordsSkipped] [int] NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'Parameters')
        ALTER TABLE [dbo].[tblReportGenerationLog] ADD [Parameters] [nvarchar](max) NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'ExecutionTimeMs')
        ALTER TABLE [dbo].[tblReportGenerationLog] ADD [ExecutionTimeMs] [int] NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tblReportGenerationLog]') AND name = 'CreatedBy')
        ALTER TABLE [dbo].[tblReportGenerationLog] ADD [CreatedBy] [nvarchar](50) NULL;
END

-- Create tblWhatsAppConfig if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tblWhatsAppConfig]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tblWhatsAppConfig](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ConfigKey] [nvarchar](50) NOT NULL,
        [ConfigValue] [nvarchar](500) NOT NULL,
        [Description] [nvarchar](200) NULL,
        [CreatedAt] [datetime] NOT NULL,
        [UpdatedAt] [datetime] NULL,
        CONSTRAINT [PK_tblWhatsAppConfig] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_tblWhatsAppConfig_ConfigKey] UNIQUE NONCLUSTERED ([ConfigKey] ASC)
    )

    -- Insert default configuration
    INSERT INTO [dbo].[tblWhatsAppConfig] ([ConfigKey], [ConfigValue], [Description], [CreatedAt])
    VALUES 
        ('apiUrl', 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', 'WhatsApp API URL', GETDATE()),
        ('timeout', '30000', 'API request timeout in milliseconds', GETDATE()),
        ('maxFileSize', '16000000', 'Maximum file size in bytes (16MB)', GETDATE()),
        ('enabled', 'true', 'Enable/disable WhatsApp integration', GETDATE())
END