import { ScrollViewStyleReset } from 'expo-router/html';

export default function Html({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                <meta name="theme-color" content="#0f3d91" />
                <link rel="icon" href="/favicon.svg" />
                <link rel="manifest" href="/site.webmanifest" />
                <ScrollViewStyleReset />
            </head>
            <body>{children}</body>
        </html>
    );
}
