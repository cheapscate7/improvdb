import { type AppType } from "next/app";
import NextNProgress from "nextjs-progressbar";
import { ClerkProvider } from "@clerk/nextjs";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { usePreserveScroll } from "~/hooks/usePreserveScroll";
import Head from "next/head";
import { Toaster } from "react-hot-toast";

const MyApp: AppType = ({ Component, pageProps }) => {
  usePreserveScroll();
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>The Improvitory</title>
        <meta
          name="description"
          content="The ultimate repository for improv games & exercises."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NextNProgress />
      <Toaster />
      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
