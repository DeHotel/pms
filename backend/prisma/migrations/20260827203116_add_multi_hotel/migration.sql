/*
  Warnings:

  - A unique constraint covering the columns `[hotelId,name]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hotelId,name]` on the table `room_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hotelId,number]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hotelId` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotelId` to the `guests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotelId` to the `reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotelId` to the `room_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotelId` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotelId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[reservations] DROP CONSTRAINT [reservations_companyId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[reservations] DROP CONSTRAINT [reservations_guestId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[reservations] DROP CONSTRAINT [reservations_roomId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[rooms] DROP CONSTRAINT [rooms_roomTypeId_fkey];

-- DropIndex
ALTER TABLE [dbo].[companies] DROP CONSTRAINT [companies_name_key];

-- DropIndex
ALTER TABLE [dbo].[room_types] DROP CONSTRAINT [room_types_name_key];

-- DropIndex
ALTER TABLE [dbo].[rooms] DROP CONSTRAINT [rooms_number_key];

-- AlterTable
ALTER TABLE [dbo].[companies] ADD [hotelId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[guests] ADD [hotelId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[reservations] ADD [hotelId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[room_types] ADD [hotelId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[rooms] ADD [hotelId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[users] ADD [hotelId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[hotels] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [primaryColor] NVARCHAR(1000) NOT NULL CONSTRAINT [hotels_primaryColor_df] DEFAULT '#2563eb',
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [hotels_currency_df] DEFAULT 'ARS',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [hotels_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [hotels_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
ALTER TABLE [dbo].[companies] ADD CONSTRAINT [companies_hotelId_name_key] UNIQUE NONCLUSTERED ([hotelId], [name]);

-- CreateIndex
ALTER TABLE [dbo].[room_types] ADD CONSTRAINT [room_types_hotelId_name_key] UNIQUE NONCLUSTERED ([hotelId], [name]);

-- CreateIndex
ALTER TABLE [dbo].[rooms] ADD CONSTRAINT [rooms_hotelId_number_key] UNIQUE NONCLUSTERED ([hotelId], [number]);

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[room_types] ADD CONSTRAINT [room_types_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[rooms] ADD CONSTRAINT [rooms_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[rooms] ADD CONSTRAINT [rooms_roomTypeId_fkey] FOREIGN KEY ([roomTypeId]) REFERENCES [dbo].[room_types]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[guests] ADD CONSTRAINT [guests_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[companies] ADD CONSTRAINT [companies_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_hotelId_fkey] FOREIGN KEY ([hotelId]) REFERENCES [dbo].[hotels]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_roomId_fkey] FOREIGN KEY ([roomId]) REFERENCES [dbo].[rooms]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_guestId_fkey] FOREIGN KEY ([guestId]) REFERENCES [dbo].[guests]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
