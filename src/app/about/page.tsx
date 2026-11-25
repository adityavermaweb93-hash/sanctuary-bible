"use client";

import React, { useEffect, useState } from "react";
import { Shield, Mail, FileText, Info } from "lucide-react";

export default function AboutLegalPage() {
  const [legal, setLegal] = useState({
    aboutText:
      "Sanctuary Bible is a modern English Bible reading and study platform built with respect for Scripture copyright and licensing.",
    contactEmail: "support@sanctuarybible.app",
    privacyPolicy:
      "We respect your privacy. Your personal notes, bookmarks, and highlights remain private to your account. Analytics use daily-salted hashes without storing raw IP addresses.",
    termsText:
      "Public domain translations are provided freely. Copyrighted translations remain the property of their respective publishers and are enabled only under valid license.",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.legal) {
          setLegal((prev) => ({ ...prev, ...d.settings.legal }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">About, Privacy & Terms</h1>

      <section
        className="rounded-2xl border p-6 space-y-2"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-bold flex items-center gap-2">
          <Info className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
          About Sanctuary Bible
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {legal.aboutText}
        </p>
      </section>

      <section
        className="rounded-2xl border p-6 space-y-2"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-bold flex items-center gap-2">
          <Mail className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
          Contact Information
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Support & licensing inquiries:{" "}
          <a href={`mailto:${legal.contactEmail}`} className="underline font-medium">
            {legal.contactEmail}
          </a>
        </p>
      </section>

      <section
        className="rounded-2xl border p-6 space-y-2"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-bold flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
          Privacy Policy
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {legal.privacyPolicy}
        </p>
      </section>

      <section
        className="rounded-2xl border p-6 space-y-2"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-bold flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
          Terms & Conditions & Scripture Copyright
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {legal.termsText}
        </p>
      </section>
    </div>
  );
}
