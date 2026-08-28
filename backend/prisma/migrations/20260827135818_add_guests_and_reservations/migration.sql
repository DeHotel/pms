BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[guests] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [documentId] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [guests_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [guests_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[reservations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [roomId] INT NOT NULL,
    [guestId] INT NOT NULL,
    [checkIn] DATETIME2 NOT NULL,
    [checkOut] DATETIME2 NOT NULL,
    [guestsCount] INT NOT NULL CONSTRAINT [reservations_guestsCount_df] DEFAULT 1,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [reservations_status_df] DEFAULT 'PENDIENTE',
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [reservations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [reservations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_roomId_fkey] FOREIGN KEY ([roomId]) REFERENCES [dbo].[rooms]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_guestId_fkey] FOREIGN KEY ([guestId]) REFERENCES [dbo].[guests]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
