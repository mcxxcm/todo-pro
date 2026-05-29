import { Redirect, useLocalSearchParams } from "expo-router";

export default function ShareRedirect() {
  const params = useLocalSearchParams<{
    text?: string | string[];
    title?: string | string[];
    url?: string | string[];
    source?: string | string[];
  }>();

  const text = Array.isArray(params.text) ? params.text[0] : params.text;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const sharedText = [title, text, url].filter(Boolean).join("\n");

  return (
    <Redirect
      href={{
        pathname: "/",
        params: {
          ...(sharedText ? { text: sharedText } : {}),
          ...(source ? { source } : { source: "share" }),
        },
      }}
    />
  );
}
