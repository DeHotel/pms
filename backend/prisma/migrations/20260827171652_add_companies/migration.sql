/*
  Warnings:

  - You are about to drop the column `clientType` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `reservations` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[reservations] DROP CONSTRAINT [reservations_clientType_df];
ALTER TABLE [dbo].[reservations] DROP COLUMN [clientType],
[company];
ALTER TABLE [dbo].[reservations] ADD [companyId] INT;

-- CreateTable
CREATE TABLE [dbo].[companies] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [companies_type_df] DEFAULT 'EMPRESA',
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [companies_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [companies_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [companies_name_key] UNIQUE NONCLUSTERED ([name])
);

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
