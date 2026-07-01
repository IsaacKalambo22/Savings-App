import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { ExportFormat, ExportDataType, ExportOptions } from "@/types/export";
import { exportToCSV } from "@/features/export/services/csv-export.service";
import { exportToExcel } from "@/features/export/services/excel-export.service";
import { exportToPDF } from "@/features/export/services/pdf-export.service";
import { useState } from "react";
import dayjs from "dayjs";

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  accountId?: string;
}

export function ExportModal({ visible, onClose, accountId }: ExportModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dataType, setDataType] = useState<ExportDataType>("transactions");
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; recordCount?: number } | null>(null);

  const formats: { value: ExportFormat; label: string; icon: string }[] = [
    { value: "csv", label: "CSV", icon: "document-text" },
    { value: "excel", label: "Excel", icon: "grid" },
    { value: "pdf", label: "PDF", icon: "document" },
  ];

  const dataTypes: { value: ExportDataType; label: string; icon: string }[] = [
    { value: "transactions", label: "Transactions", icon: "swap-horizontal" },
    { value: "accounts", label: "Accounts", icon: "wallet" },
    { value: "reports", label: "Reports", icon: "bar-chart" },
    { value: "all", label: "All Data", icon: "layers" },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    const options: ExportOptions = {
      format,
      dataType,
      accountId,
      includeTags: true,
    };

    try {
      let result;
      switch (format) {
        case "csv":
          result = await exportToCSV(options);
          break;
        case "excel":
          result = await exportToExcel(options);
          break;
        case "pdf":
          result = await exportToPDF(options);
          break;
      }

      if (result.success) {
        setExportResult({
          success: true,
          message: "Export successful!",
          recordCount: result.recordCount,
        });
      } else {
        setExportResult({
          success: false,
          message: result.error || "Export failed",
        });
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setExportResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
          <TouchableOpacity onPress={handleClose}>
            <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Export Data
          </Text>
          <TouchableOpacity onPress={handleExport} disabled={isExporting}>
            <Text className="text-base font-semibold" style={{ color: isExporting ? colors.textTertiary : colors.primary }}>
              {isExporting ? "Exporting..." : "Export"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Format Selection */}
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              FORMAT
            </Text>
            <View className="flex-row gap-3">
              {formats.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setFormat(f.value)}
                  className="flex-1 p-4 rounded-xl items-center"
                  style={{
                    backgroundColor: format === f.value ? colors.primary + "20" : colors.surface,
                    borderColor: format === f.value ? colors.primary : colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Ionicons name={f.icon as any} size={24} color={format === f.value ? colors.primary : colors.textSecondary} />
                  <Text className="text-sm mt-2 font-semibold" style={{ color: colors.text }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              DATA TYPE
            </Text>
            {dataTypes.map((dt) => (
              <TouchableOpacity
                key={dt.value}
                onPress={() => setDataType(dt.value)}
                className="flex-row items-center justify-between p-4 rounded-xl mb-2"
                style={{
                  backgroundColor: dataType === dt.value ? colors.primary + "20" : colors.surface,
                  borderColor: dataType === dt.value ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name={dt.icon as any} size={20} color={colors.textSecondary} className="mr-3" />
                  <Text className="text-base" style={{ color: colors.text }}>
                    {dt.label}
                  </Text>
                </View>
                {dataType === dt.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Export Result */}
          {exportResult && (
            <View
              className="p-4 rounded-xl"
              style={{
                backgroundColor: exportResult.success ? colors.success + "20" : colors.destructive + "20",
                borderColor: exportResult.success ? colors.success : colors.destructive,
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={exportResult.success ? "checkmark-circle" : "alert-circle"}
                  size={20}
                  color={exportResult.success ? colors.success : colors.destructive}
                  className="mr-2"
                />
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {exportResult.message}
                </Text>
              </View>
              {exportResult.recordCount && (
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {exportResult.recordCount} records exported
                </Text>
              )}
            </View>
          )}

          {/* Info */}
          <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color={colors.primary} className="mr-2 mt-0.5" />
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Exported files will be saved to your device and can be shared via the system share sheet.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
