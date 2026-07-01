import { PrismaClient } from "@/types/prisma";
import { ExportOptions, ExportResult } from "@/types/export";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

const prisma = new PrismaClient();

/**
 * CSV Export Service
 * Exports data to CSV format
 */

/**
 * Export transactions to CSV
 */
async function exportTransactionsToCSV(options: ExportOptions): Promise<string> {
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

  // CSV Header
  let csv = "Date,Account,Type,Amount,Note,Tags\n";

  // CSV Rows
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
 * Export accounts to CSV
 */
async function exportAccountsToCSV(): Promise<string> {
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

  // CSV Header
  let csv = "Name,Description,Icon,Color,Balance,Transaction Count,Created At\n";

  // CSV Rows
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
 * Export data to CSV file
 */
export async function exportToCSV(options: ExportOptions): Promise<ExportResult> {
  try {
    let csv = "";
    let filename = "";
    let recordCount = 0;

    switch (options.dataType) {
      case "transactions":
        csv = await exportTransactionsToCSV(options);
        filename = `transactions_${dayjs().format("YYYY-MM-DD")}.csv`;
        recordCount = csv.split("\n").length - 1;
        break;
      case "accounts":
        csv = await exportAccountsToCSV();
        filename = `accounts_${dayjs().format("YYYY-MM-DD")}.csv`;
        recordCount = csv.split("\n").length - 1;
        break;
      case "reports":
        // For reports, export transactions as CSV
        csv = await exportTransactionsToCSV(options);
        filename = `report_${dayjs().format("YYYY-MM-DD")}.csv`;
        recordCount = csv.split("\n").length - 1;
        break;
      case "all":
        // Export both accounts and transactions
        const accountsCsv = await exportAccountsToCSV();
        const transactionsCsv = await exportTransactionsToCSV(options);
        csv = `=== ACCOUNTS ===\n${accountsCsv}\n\n=== TRANSACTIONS ===\n${transactionsCsv}`;
        filename = `nestkeep_export_${dayjs().format("YYYY-MM-DD")}.csv`;
        recordCount = accountsCsv.split("\n").length + transactionsCsv.split("\n").length - 2;
        break;
    }

    // Write to file
    const fileUri = (FileSystem as any).documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export CSV",
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
