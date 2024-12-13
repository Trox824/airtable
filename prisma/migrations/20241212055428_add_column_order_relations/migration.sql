-- CreateTable
CREATE TABLE "ColumnOrder" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColumnOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ColumnOrder_viewId_idx" ON "ColumnOrder"("viewId");

-- CreateIndex
CREATE INDEX "ColumnOrder_columnId_idx" ON "ColumnOrder"("columnId");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnOrder_viewId_columnId_key" ON "ColumnOrder"("viewId", "columnId");

-- AddForeignKey
ALTER TABLE "ColumnOrder" ADD CONSTRAINT "ColumnOrder_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnOrder" ADD CONSTRAINT "ColumnOrder_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;
