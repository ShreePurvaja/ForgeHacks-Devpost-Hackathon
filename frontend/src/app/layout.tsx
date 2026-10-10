import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hospital-OS — Agentic Hospital Operating System",
  description: "HL7 FHIR Event-Driven Multi-Agent Healthcare Platform powered by LangGraph, FastAPI, and Groq GPT-OSS-120B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(key, val) {
                    if (key === 'bis_skin_checked') return;
                    return origSetAttr.apply(this, arguments);
                  };
                  var obs = new MutationObserver(function(muts) {
                    for (var i = 0; i < muts.length; i++) {
                      var t = muts[i].target;
                      if (t && t.hasAttribute && t.hasAttribute('bis_skin_checked')) {
                        t.removeAttribute('bis_skin_checked');
                      }
                    }
                  });
                  obs.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      var els = document.querySelectorAll('[bis_skin_checked]');
                      for (var j = 0; j < els.length; j++) els[j].removeAttribute('bis_skin_checked');
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body 
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
