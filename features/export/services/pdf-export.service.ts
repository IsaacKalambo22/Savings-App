import { ExportOptions, ExportResult } from "@/types/export";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import { getExportAccounts, getExportTransactions } from "./export-data";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

/**
 * PDF Export Service
 * Exports data to PDF format (HTML-based PDF)
 * Note: For true PDF generation, would need a library like react-native-pdf
 */

/**
 * Export transactions to PDF format
 */
async function exportTransactionsToPDF(options: ExportOptions): Promise<string> {
  const transactions = await getExportTransactions(options);

  // HTML content for PDF
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0A63E0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #0A63E0; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .deposit { color: #22C55E; font-weight: bold; }
        .withdrawal { color: #EF4444; font-weight: bold; }
        .transfer { color: #0A63E0; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>NestKeep Transactions Report</h1>
      <p>Generated: ${dayjs().format("DD MMM YYYY HH:mm")}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Account</th>
            <th>Type</th>
            <th>Amount (MK)</th>
            <th>Note</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
  `;

  transactions.forEach((t) => {
    const date = dayjs(t.transactedAt).format("DD/MM/YYYY HH:mm");
    const account = t.account.name;
    const type = t.type;
    const amount = fromBigInt(t.amount);
    const note = t.note || "-";
    const tags = t.tags?.join(", ") || "-";
    const typeClass = type.toLowerCase();

    html += `
      <tr>
        <td>${date}</td>
        <td>${account}</td>
        <td class="${typeClass}">${type}</td>
        <td>${amount.toLocaleString()}</td>
        <td>${note}</td>
        <td>${tags}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <p style="margin-top: 20px;">Total Records: ${transactions.length}</p>
    </body>
    </html>
  `;

  return html;
}

/**
 * Export accounts to PDF format
 */
async function exportAccountsToPDF(): Promise<string> {
  const accounts = await getExportAccounts();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0A63E0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #0A63E0; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>NestKeep Accounts Report</h1>
      <p>Generated: ${dayjs().format("DD MMM YYYY HH:mm")}</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Balance (MK)</th>
            <th>Transactions</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
  `;

  accounts.forEach((a) => {
    const name = a.name;
    const description = a.description || "-";
    const balance = fromBigInt(a.balance);
    const transactionCount = a.transactionCount;
    const createdAt = dayjs(a.createdAt).format("DD/MM/YYYY");

    html += `
      <tr>
        <td>${name}</td>
        <td>${description}</td>
        <td>${balance.toLocaleString()}</td>
        <td>${transactionCount}</td>
        <td>${createdAt}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <p style="margin-top: 20px;">Total Accounts: ${accounts.length}</p>
    </body>
    </html>
  `;

  return html;
}

/**
 * Export data to PDF file
 */
export async function exportToPDF(options: ExportOptions): Promise<ExportResult> {
  try {
    let html = "";
    let filename = "";
    let recordCount = 0;

    switch (options.dataType) {
      case "transactions":
        html = await exportTransactionsToPDF(options);
        filename = `transactions_${dayjs().format("YYYY-MM-DD")}.html`;
        recordCount = (html.match(/<tr>/g) || []).length - 1;
        break;
      case "accounts":
        html = await exportAccountsToPDF();
        filename = `accounts_${dayjs().format("YYYY-MM-DD")}.html`;
        recordCount = (html.match(/<tr>/g) || []).length - 1;
        break;
      case "reports":
        html = await exportTransactionsToPDF(options);
        filename = `report_${dayjs().format("YYYY-MM-DD")}.html`;
        recordCount = (html.match(/<tr>/g) || []).length - 1;
        break;
      case "all":
        const accountsHtml = await exportAccountsToPDF();
        const transactionsHtml = await exportTransactionsToPDF(options);
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .section { margin-bottom: 40px; page-break-after: always; }
            </style>
          </head>
          <body>
            <div class="section">${accountsHtml.replace(/<!DOCTYPE html>|<html>|<head>.*?<\/head>|<body>|<\/body>|<\/html>/g, "")}</div>
            <div class="section">${transactionsHtml.replace(/<!DOCTYPE html>|<html>|<head>.*?<\/head>|<body>|<\/body>|<\/html>/g, "")}</div>
          </body>
          </html>
        `;
        filename = `nestkeep_export_${dayjs().format("YYYY-MM-DD")}.html`;
        recordCount = (html.match(/<tr>/g) || []).length - 2;
        break;
    }

    const fileUri = (FileSystem as any).documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/html",
        dialogTitle: "Export PDF",
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
