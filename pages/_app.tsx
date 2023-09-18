import type { AppProps } from "next/app";
import "../styles.scss";
import "../editor.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
