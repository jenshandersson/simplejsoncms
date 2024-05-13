import type { AppProps } from "next/app";
import "../styles.scss";
import "../editor.css";
import { Analytics } from "@vercel/analytics/react";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />;
      <Analytics />
    </>
  );
}
