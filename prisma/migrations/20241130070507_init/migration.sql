-- DropIndex
DROP INDEX "Row_tableId_id_idx";

-- CreateIndex
CREATE INDEX "Row_tableId_idx" ON "Row"("tableId");

-- CreateIndex
CREATE INDEX "Row_id_idx" ON "Row"("id");
