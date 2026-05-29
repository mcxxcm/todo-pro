import type { SourceItemType } from "@/types/source";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/i;
const EMAIL_TEXT_PATTERN =
  /(^|\n)\s*(subject|from|to|date|发件人|收件人|主题|日期)\s*[:：]/i;

export interface IntakeClassification {
  sourceType: SourceItemType;
  titlePrefix: string;
  url?: string;
}

export function classifyIntake(
  text: string,
  requestedType: SourceItemType = "text",
): IntakeClassification {
  const url = text.match(URL_PATTERN)?.[0];

  if (
    EMAIL_TEXT_PATTERN.test(text) &&
    (requestedType === "text" || requestedType === "share")
  ) {
    return {
      sourceType: "email",
      titlePrefix: requestedType === "share" ? "分享邮件" : "邮件文本",
      ...(url && { url }),
    };
  }

  if (
    url &&
    /\.pdf(?:[?#].*)?$/i.test(url) &&
    (requestedType === "text" || requestedType === "share")
  ) {
    return {
      sourceType: "pdf",
      titlePrefix: requestedType === "share" ? "分享 PDF" : "PDF 链接",
      url,
    };
  }

  if (url && (requestedType === "text" || requestedType === "share")) {
    return {
      sourceType: "link",
      titlePrefix: requestedType === "share" ? "分享链接" : "网页链接",
      url,
    };
  }

  return {
    sourceType: requestedType,
    titlePrefix: getSourceTitlePrefix(requestedType),
    ...(url && { url }),
  };
}

function getSourceTitlePrefix(type: SourceItemType) {
  switch (type) {
    case "image":
      return "图片 OCR";
    case "share":
      return "分享文本";
    case "pdf":
      return "PDF";
    case "email":
      return "邮件";
    case "link":
      return "网页链接";
    case "manual":
      return "手动输入";
    case "text":
    default:
      return "文本输入";
  }
}
