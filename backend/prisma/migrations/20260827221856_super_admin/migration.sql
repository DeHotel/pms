BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[users] DROP CONSTRAINT [users_hotelId_fkey];

-- AlterTable
ALTER TABLE [dbo].[users] ALTER COLUMN [hotelId] INT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
