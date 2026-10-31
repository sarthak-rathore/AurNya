'use client';
// Last-resort page if the site's outer layout itself fails. It must bring its own <html> and <body>, and cannot rely on site styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <head><style>{`body{margin:0;font-family:Georgia,serif;background:#FBF7EE;color:#2B2730;text-align:center;padding:120px 24px}.m{color:#6F6676}.b{margin-top:24px;padding:12px 32px;border-radius:999px;border:0;background:#2B2730;color:#FBF7EE;letter-spacing:2px;text-transform:uppercase;font-size:12px;cursor:pointer}@media(prefers-color-scheme:dark){body{background:#18151D;color:#F3EEE4}.m{color:#B9AFC0}.b{background:#F3EEE4;color:#18151D}}`}</style></head>
      <body>
        <h1 style={{ fontWeight: 500, fontSize: 40 }}>Something went wrong</h1>
        <p className="m">AurNya is having trouble right now. Please try again in a moment.</p>
        <button type="button" className="b" onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
