import Foundation
import Vision

guard CommandLine.arguments.count >= 2 else {
  fputs("Usage: apple_vision_ocr.swift <image-path>\n", stderr)
  exit(2)
}

let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true

if #available(macOS 11.0, *) {
  request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]
}

let handler = VNImageRequestHandler(url: imageURL, options: [:])

do {
  try handler.perform([request])
  let text = request.results?
    .compactMap { $0.topCandidates(1).first?.string }
    .joined(separator: "\n") ?? ""
  print(text)
} catch {
  fputs("Apple Vision OCR failed: \(error.localizedDescription)\n", stderr)
  exit(1)
}
