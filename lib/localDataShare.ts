import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

import type { LocalDataExportBundle } from "@/domain/localDataExport";

export interface LocalDataShareResult {
  exportedAt: string;
  fileUri?: string;
  shared: boolean;
  size: number;
}

export async function shareLocalDataBundle(
  bundle: LocalDataExportBundle,
): Promise<LocalDataShareResult> {
  const json = JSON.stringify(bundle, null, 2);
  const fileName = `todo-pro-export-${toFileTimestamp(bundle.exportedAt)}.json`;

  if (FileSystem.documentDirectory) {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        dialogTitle: "导出 Todo Pro 本地数据",
        mimeType: "application/json",
        UTI: "public.json",
      });
      return {
        exportedAt: bundle.exportedAt,
        fileUri,
        shared: true,
        size: json.length,
      };
    }

    return {
      exportedAt: bundle.exportedAt,
      fileUri,
      shared: false,
      size: json.length,
    };
  }

  await Share.share({
    message: json,
    title: fileName,
  });

  return {
    exportedAt: bundle.exportedAt,
    shared: true,
    size: json.length,
  };
}

function toFileTimestamp(value: string) {
  return value.replace(/[:.]/g, "-");
}
