import "@/styles/globals.css";
import type { AppProps } from "next/app";
import InstallPWA from "@/components/shared/InstallPWA";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <InstallPWA />
    </>
  );
}
