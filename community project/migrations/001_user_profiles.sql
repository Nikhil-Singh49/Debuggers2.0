IF OBJECT_ID(N'dbo.user_profiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_profiles (
        user_id int NOT NULL
            CONSTRAINT PK_user_profiles PRIMARY KEY,
        display_name nvarchar(100) NOT NULL,
        updated_at datetime2(0) NOT NULL
            CONSTRAINT DF_user_profiles_updated_at DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_user_profiles_users FOREIGN KEY (user_id)
            REFERENCES dbo.users (user_id)
    );
END;
