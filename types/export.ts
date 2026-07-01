export type ExportFormat = "csv" | "excel" | "pdf";

export type ExportDataType = "transactions" | "accounts" | "reports" | "all";

export interface ExportOptions {
  format: ExportFormat;
  dataType: ExportDataType;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  includeTags?: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  recordCount?: number;
}

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  recordCount: {
    accounts: number;
    transactions: number;
    transfers: number;
  };
  fileSize: number;
}
