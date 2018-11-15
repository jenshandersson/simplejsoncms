import Document, { Head, Main, NextScript } from "next/document";

const description =
  "Online JSON editor for non-devs automatically exposed through our fast API. Perfect for your simple site/app when you need the client to make changes (but don't need a full fledged CMS like wordpress, squarespace etc).";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <html>
        <Head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <meta name="description" content={description} />
          <meta key="og:type" property="og:title" content="website" />
          <meta
            key="og:description"
            property="og:description"
            content={description}
          />
          <link
            rel="stylesheet"
            href="https://unpkg.com/spectre.css/dist/spectre.min.css"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
