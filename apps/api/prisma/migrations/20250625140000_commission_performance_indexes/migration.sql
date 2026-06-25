-- CreateIndex
CREATE INDEX "CommissionLedger_tenantId_createdAt_idx" ON "CommissionLedger"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CommissionLedger_tenantId_distributorId_status_idx" ON "CommissionLedger"("tenantId", "distributorId", "status");

-- CreateIndex
CREATE INDEX "Binding_tenantId_distributorId_boundAt_idx" ON "Binding"("tenantId", "distributorId", "boundAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_distributorId_status_createdAt_idx" ON "Order"("tenantId", "distributorId", "status", "createdAt");
