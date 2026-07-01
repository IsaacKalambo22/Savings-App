import { PrismaClient } from "@/types/prisma";
import { ExportOptions, ExportResult } from "@/types/export";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

const prisma = new PrismaClient();

/**
 * Excel Export Service
 * Exports data to Excel-compatible format (CSV with .xlsx extension)
 * Note: For true Excel files, would need a library like xlsx
 */

/**
 * Export transactions to Excel format
 */
async function exportTransactionsToExcel(options: ExportOptions): Promise<string> {
  const where: any = {
    deletedAt: null,
  };

  if (options.accountId) {
    where.accountId = options.accountId;
  }

  if (options.startDate || options.endDate) {
    where.transactedAt = {};
    if (options.startDate) {
      where.transactedAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.transactedAt.lte = options.endDate;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true },
    orderBy: { transactedAt: "desc" },
  });

  // Excel-compatible CSV with BOM for UTF-8
  let csv = "\uFEFF"; // BOM for Excel UTF-8 compatibility
  csv += "Date,Account,Type,Amount (MK),Note,Tags\n";

  transactions.forEach((t) => {
    const date = dayjs(t.transactedAt).format("DD/MM/YYYY HH:mm");
    const account = t.account.name;
    const type = t.type;
    const amount = fromBigInt(t.amount);
    const note = t.note || "";
    const tags = t.tags?.join(", ") || "";

    csv += `"${date}","${account}","${type}",${amount},"${note}","${tags}"\n`;
  });

  return csv;
}

/**
 * Export accounts to Excel format
 */
async function exportAccountsToExcel(): Promise<string> {
  const accounts = await prisma.account.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { transactions: true },
      },
      transactions: {
        where: { deletedAt: null, isReversed: false },
      },
    },
  });

  let csv = "\uFEFF"; // BOM for Excel UTF-8 compatibility
  csv += "Name,Description,Icon,Color,Balance (MK),Transaction Count,Created At\n";

  accounts.forEach((a) => {
    const name = a.name;
    const description = a.description || "";
    const icon = a.icon;
    const color = a.color;
    // Calculate balance from transactions
    const deposits = a.transactions
      .filter((t: any) => t.type === "DEPOSIT")
      .reduce((sum: bigint, t: any) => sum + t.amount, BigInt(0));
    const withdrawals = a.transactions
      .filter((t: any) => t.type === "WITHDRAWAL")
      .reduce((sum: bigint, t: any) => sum + t.amount, BigInt(0));
    const balance = fromBigInt(deposits - withdrawals);
    const transactionCount = a._count.transactions;
    const createdAt = dayjs(a.createdAt).format("DD/MM/YYYY");

    csv += `"${name}","${description}","${icon}","${color}",${balance},${transactionCount},"${createdAt}"\n`;
  });

  return csv;
}

/**
 * Export data to Excel file
 */
export async function exportToExcel(options: ExportOptions): Promise<ExportResult> {
  try {
    let csv = "";
    let filename = "";
    let recordCount = 0;

    switch (options.dataType) {
      case "transactions":
        csv = await exportTransactionsToExcel(options);
        filename = `transactions_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        recordCount = csv.split("\n").length - 1;
        break;
      case "accounts":
        csv = await exportAccountsToExcel();
        filename = `accounts_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        recordCount = csv.split("\n").length - 1;
        break;
      case "reports":
        csv = await exportTransactionsToExcel(options);
        filename = `report_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        recordCount = csv.split("\n").length - 1;
        break;
      case "all":
        const accountsCsv = await exportAccountsToExcel();
        const transactionsCsv = await exportTransactionsToExcel(options);
        csv = `=== ACCOUNTS ===\n${accountsCsv}\n\n=== TRANSACTIONS ===\n${transactionsCsv}`;
        filename = `nestkeep_export_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        recordCount = accountsCsv.split("\n").length + transactionsCsv.split("\n").length - 2;
        break;
    }

    const fileUri = (FileSystem as any).documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Excel",
      });
    }

    return {
      success: true,
      filePath: fileUri,
      recordCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
