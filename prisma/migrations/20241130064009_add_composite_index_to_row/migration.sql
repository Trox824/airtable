-- DropIndex
DROP INDEX "Row_id_idx";

-- DropIndex
DROP INDEX "Row_tableId_idx";

-- CreateIndex
CREATE INDEX "Row_tableId_id_idx" ON "Row"("tableId", "id");
