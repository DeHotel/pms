BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[room_types] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [basePrice] DECIMAL(10,2) NOT NULL,
    [capacity] INT NOT NULL CONSTRAINT [room_types_capacity_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [room_types_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [room_types_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [room_types_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[rooms] (
    [id] INT NOT NULL IDENTITY(1,1),
    [number] NVARCHAR(1000) NOT NULL,
    [floor] INT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [rooms_status_df] DEFAULT 'DISPONIBLE',
    [notes] NVARCHAR(1000),
    [roomTypeId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [rooms_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [rooms_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [rooms_number_key] UNIQUE NONCLUSTERED ([number])
);

-- AddForeignKey
ALTER TABLE [dbo].[rooms] ADD CONSTRAINT [rooms_roomTypeId_fkey] FOREIGN KEY ([roomTypeId]) REFERENCES [dbo].[room_types]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
