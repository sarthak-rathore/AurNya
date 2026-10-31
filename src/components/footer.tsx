'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeSwitch } from './theme-switch';
import { social } from '@/lib/env';

export function Footer() {
  const [showConcierge, setShowConcierge] = useState(true);
  const [conciergeModalOpen, setConciergeModalOpen] = useState(false);

  return (
    <>
      <footer className="relative bg-[#211a28] pt-16 pb-10 text-[#f2ebf7] antialiased">
        {/* Subtle Luxury Gradient Glow at Top in AurNya Champagne Gold */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e4d2a8]/50 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Centered Top Brand Emblem */}
          <div className="mb-14 flex flex-col items-center text-center">
            {/* Elegant Golden Crest */}
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#e4d2a8]/40 bg-[#2e2338] p-2 shadow-lg ring-2 ring-[#e4d2a8]/10">
              <svg viewBox="0 0 100 100" className="h-9 w-9 text-[#e4d2a8]" fill="currentColor" aria-hidden="true">
                <path d="M50 12 C40 28 20 40 20 62 C20 78 33 88 50 88 C67 88 80 78 80 62 C80 40 60 28 50 12 Z M50 25 C58 37 72 48 72 62 C72 74 62 81 50 81 C38 81 28 74 28 62 C28 48 42 37 50 25 Z" />
                <circle cx="50" cy="58" r="9" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-[0.25em] text-[#fbf7ee] uppercase sm:text-4xl">
              AurNya
            </h2>
            <p className="mt-1 text-[11px] font-medium tracking-[0.32em] text-[#e4d2a8] uppercase">
              House of Timeless Luxury Jewels
            </p>
          </div>

          {/* 4 Main Columns (App Download + Useful Links + Information + Contact Us) */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            
            {/* Column 1: App Download & QR Code */}
            <div>
              <h3 className="font-serif text-lg font-medium text-[#fbf7ee] tracking-wide">
                Download the AurNya App Now
              </h3>
              
              {/* QR Code Card */}
              <div className="mt-4 inline-flex flex-col items-center rounded-xl bg-white p-3 shadow-md">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  {/* High Quality Stylized SVG QR Code */}
                  <svg viewBox="0 0 120 120" className="h-full w-full text-[#211a28]" fill="currentColor" aria-label="AurNya Mobile App QR Code">
                    {/* Top Left Finder */}
                    <rect x="10" y="10" width="30" height="30" rx="4" />
                    <rect x="15" y="15" width="20" height="20" rx="2" fill="white" />
                    <rect x="20" y="20" width="10" height="10" rx="1" />
                    {/* Top Right Finder */}
                    <rect x="80" y="10" width="30" height="30" rx="4" />
                    <rect x="85" y="15" width="20" height="20" rx="2" fill="white" />
                    <rect x="90" y="20" width="10" height="10" rx="1" />
                    {/* Bottom Left Finder */}
                    <rect x="10" y="80" width="30" height="30" rx="4" />
                    <rect x="15" y="85" width="20" height="20" rx="2" fill="white" />
                    <rect x="20" y="90" width="10" height="10" rx="1" />
                    {/* Data Pattern Modules */}
                    <rect x="45" y="12" width="6" height="6" />
                    <rect x="57" y="12" width="6" height="6" />
                    <rect x="69" y="12" width="6" height="6" />
                    <rect x="45" y="24" width="6" height="6" />
                    <rect x="57" y="24" width="6" height="6" />
                    <rect x="69" y="24" width="6" height="6" />
                    <rect x="12" y="45" width="6" height="6" />
                    <rect x="24" y="45" width="6" height="6" />
                    <rect x="36" y="45" width="6" height="6" />
                    <rect x="12" y="57" width="6" height="6" />
                    <rect x="24" y="57" width="6" height="6" />
                    <rect x="36" y="57" width="6" height="6" />
                    <rect x="12" y="69" width="6" height="6" />
                    <rect x="24" y="69" width="6" height="6" />
                    <rect x="36" y="69" width="6" height="6" />
                    {/* Bottom Right Modules */}
                    <rect x="45" y="80" width="6" height="6" />
                    <rect x="57" y="80" width="6" height="6" />
                    <rect x="80" y="45" width="6" height="6" />
                    <rect x="92" y="45" width="6" height="6" />
                    <rect x="104" y="45" width="6" height="6" />
                    <rect x="80" y="57" width="6" height="6" />
                    <rect x="92" y="57" width="6" height="6" />
                    <rect x="104" y="57" width="6" height="6" />
                    <rect x="80" y="69" width="6" height="6" />
                    <rect x="92" y="69" width="6" height="6" />
                    <rect x="104" y="69" width="6" height="6" />
                    <rect x="45" y="95" width="6" height="6" />
                    <rect x="57" y="95" width="6" height="6" />
                    <rect x="69" y="95" width="6" height="6" />
                    <rect x="80" y="85" width="6" height="6" />
                    <rect x="95" y="85" width="6" height="6" />
                    <rect x="80" y="98" width="6" height="6" />
                    <rect x="95" y="98" width="6" height="6" />
                    <rect x="105" y="98" width="6" height="6" />
                  </svg>
                  {/* Center Monogram Emblem in QR */}
                  <div className="absolute inset-auto flex h-7 w-7 items-center justify-center rounded-full border border-[#e4d2a8] bg-[#211a28] text-[9px] font-serif font-bold text-[#e4d2a8] shadow">
                    AN
                  </div>
                </div>
              </div>

              {/* App Store / Google Play Buttons */}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 transition-all hover:border-[#e4d2a8] hover:bg-white/10"
                >
                  <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.436V3.25c0-.547.22-1.047.609-1.436zm11.602 11.602l2.368-2.368-2.368-2.368L12.08 12l3.13 1.416zm1.326-3.834l3.87 2.193a1.47 1.47 0 0 1 0 2.45l-3.87 2.193-2.15-2.15 2.15-4.686zM4.793 1.053l8.608 8.608-2.457 2.457-7.904-7.904a1.99 1.99 0 0 1 1.753-3.161zm0 21.894a1.99 1.99 0 0 1-1.753-3.161l7.904-7.904 2.457 2.457-8.608 8.608z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[8px] uppercase tracking-wider text-[#cbb9dc]">Download on the</div>
                    <div className="text-[11px] font-semibold text-white">Play Store</div>
                  </div>
                </a>

                <a
                  href="https://apple.com/app-store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 transition-all hover:border-[#e4d2a8] hover:bg-white/10"
                >
                  <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77 1.01.08 2.06-.52 2.68-1.27z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[8px] uppercase tracking-wider text-[#cbb9dc]">Download on the</div>
                    <div className="text-[11px] font-semibold text-white">App Store</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Column 2: Useful Links */}
            <div>
              <h3 className="font-serif text-lg font-medium text-[#fbf7ee] tracking-wide">
                Useful Links
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] text-[#d6c7e6]">
                <li><Link href="/info/shipping" className="transition-colors hover:text-[#e4d2a8]">Delivery Information</Link></li>
                <li><Link href="/info/shipping" className="transition-colors hover:text-[#e4d2a8]">International Shipping</Link></li>
                <li><Link href="/checkout" className="transition-colors hover:text-[#e4d2a8]">Payment Options</Link></li>
                <li><Link href="/account" className="transition-colors hover:text-[#e4d2a8]">Track your Order</Link></li>
                <li><Link href="/info/returns" className="transition-colors hover:text-[#e4d2a8]">Returns &amp; Exchanges</Link></li>
                <li><Link href="/about" className="transition-colors hover:text-[#e4d2a8]">Find a Boutique</Link></li>
                <li><Link href="/info/privacy" className="transition-colors hover:text-[#e4d2a8]">Exercise Your Rights</Link></li>
              </ul>
            </div>

            {/* Column 3: Information */}
            <div>
              <h3 className="font-serif text-lg font-medium text-[#fbf7ee] tracking-wide">
                Information
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] text-[#d6c7e6]">
                <li><Link href="/about" className="transition-colors hover:text-[#e4d2a8]">Blog &amp; Stories</Link></li>
                <li><Link href="/shop" className="transition-colors hover:text-[#e4d2a8]">Offers &amp; Contest Details</Link></li>
                <li><Link href="/info/faq" className="transition-colors hover:text-[#e4d2a8]">Help &amp; FAQs</Link></li>
                <li><Link href="/about" className="transition-colors hover:text-[#e4d2a8]">About AurNya</Link></li>
                <li><Link href="/info/privacy" className="transition-colors hover:text-[#e4d2a8]">Cookie Policy</Link></li>
                <li><button type="button" onClick={() => alert('AurNya uses essential cookies to ensure secure checkout and personalised luxury browsing.')} className="text-left transition-colors hover:text-[#e4d2a8]">Cookie Settings</button></li>
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div>
              <h3 className="font-serif text-lg font-medium text-[#fbf7ee] tracking-wide">
                Contact Us
              </h3>
              <div className="mt-4 space-y-4 text-[13px]">
                <div>
                  <a href="tel:18002660123" className="block text-base font-semibold tracking-wider text-white hover:text-[#e4d2a8]">
                    1800-266-0123
                  </a>
                  <p className="text-[11px] text-[#cbb9dc]">Toll-free (9:00 AM – 9:00 PM IST)</p>
                </div>

                <div className="pt-1">
                  <h4 className="font-serif text-base font-medium text-[#fbf7ee]">
                    Chat With Us
                  </h4>
                  <a href="https://wa.me/918147349242" target="_blank" rel="noopener noreferrer" className="mt-0.5 block font-semibold text-white hover:text-[#e4d2a8]">
                    +91 8147349242
                  </a>
                </div>

                {/* 3 Circular Communication Buttons (WhatsApp, Mail, Chat) */}
                <div className="flex items-center gap-3 pt-2">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/918147349242"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with AurNya on WhatsApp"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366]"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:concierge@aurnya.com"
                    aria-label="Email AurNya Concierge"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#e4d2a8] hover:bg-[#e4d2a8]/20 hover:text-[#e4d2a8]"
                  >
                    <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" viewBox="0 0 24 24">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </a>

                  {/* Live Chat */}
                  <button
                    type="button"
                    onClick={() => setConciergeModalOpen(true)}
                    aria-label="Open Live Chat with Jewellery Specialist"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#e4d2a8] hover:bg-[#e4d2a8]/20 hover:text-[#e4d2a8]"
                  >
                    <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Social Row Divider */}
          <div className="mt-12 border-t border-[#372b43] pt-6 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-serif text-base font-medium tracking-wider text-[#fbf7ee]">
                Social
              </span>
              <div className="flex items-center gap-3">
                {/* Instagram */}
                <a
                  href={social.instagram || 'https://instagram.com/aurnya'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow AurNya on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#e4d2a8] hover:bg-[#e4d2a8]/20 hover:text-[#e4d2a8]"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://x.com/aurnya"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow AurNya on X"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#e4d2a8] hover:bg-[#e4d2a8]/20 hover:text-[#e4d2a8]"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com/aurnya"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow AurNya on Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#e4d2a8] hover:bg-[#e4d2a8]/20 hover:text-[#e4d2a8]"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com/aurnya"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Watch AurNya on YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-[#e4d2a8] hover:bg-[#e4d2a8]/20 hover:text-[#e4d2a8]"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Payment Gateways Row */}
          <div className="border-t border-[#372b43] pt-6 pb-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* VISA */}
              <div className="flex h-7 w-12 items-center justify-center rounded bg-white px-1 shadow-sm">
                <span className="font-sans text-xs font-black italic tracking-tighter text-[#1A1F71]">
                  VISA
                </span>
              </div>

              {/* Mastercard */}
              <div className="flex h-7 w-12 items-center justify-center rounded bg-white px-1 shadow-sm">
                <div className="flex items-center -space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-[#EB001B] opacity-90" />
                  <div className="h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
              </div>

              {/* Maestro */}
              <div className="flex h-7 w-12 items-center justify-center rounded bg-white px-1 shadow-sm">
                <div className="flex items-center -space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-[#0061A8] opacity-90" />
                  <div className="h-4 w-4 rounded-full bg-[#EB001B] opacity-90" />
                </div>
              </div>

              {/* PayPal */}
              <div className="flex h-7 w-12 items-center justify-center rounded bg-white px-1 shadow-sm">
                <span className="font-sans text-[11px] font-extrabold italic text-[#003087]">
                  Pay<span className="text-[#0079C1]">Pal</span>
                </span>
              </div>

              {/* Diners Club */}
              <div className="flex h-7 w-12 items-center justify-center rounded bg-white px-1 shadow-sm">
                <span className="font-serif text-[9px] font-bold text-[#004A97] tracking-tight">
                  Diners
                </span>
              </div>

              {/* American Express */}
              <div className="flex h-7 w-12 items-center justify-center rounded bg-white px-1 shadow-sm">
                <span className="bg-[#006FCF] px-1 py-0.5 text-[8px] font-bold text-white rounded-[2px]">
                  AMEX
                </span>
              </div>

              {/* UPI / RuPay */}
              <div className="flex h-7 w-16 items-center justify-center rounded bg-white px-1 shadow-sm">
                <span className="font-sans text-[10px] font-extrabold tracking-tight text-[#0f7c3c]">
                  UPI<span className="text-[#f47920] font-normal"> / RuPay</span>
                </span>
              </div>

              {/* Razorpay */}
              <div className="flex h-7 w-16 items-center justify-center rounded bg-white px-1 shadow-sm">
                <span className="font-sans text-[9px] font-bold text-[#0c2340]">
                  Razorpay
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Copyright + Legal Policy Links */}
          <div className="border-t border-[#372b43] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#a896b8]">
            <p>
              © {new Date().getFullYear()} AurNya Luxury Jewels Limited. All Rights Reserved.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/info/privacy" className="transition-colors hover:text-[#e4d2a8]">
                Cyber Security Policy
              </Link>
              <Link href="/info/terms" className="transition-colors hover:text-[#e4d2a8]">
                Terms &amp; Conditions
              </Link>
              <Link href="/info/privacy" className="transition-colors hover:text-[#e4d2a8]">
                Privacy Notice
              </Link>
              <Link href="/info/faq" className="transition-colors hover:text-[#e4d2a8]">
                Disclaimer
              </Link>
              <div className="pl-2">
                <ThemeSwitch tone="footer" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Concierge Chat Pill (Bottom Right) */}
      {showConcierge && (
        <aside aria-label="Customer concierge" className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConciergeModalOpen(true)}
            className="group flex items-center gap-2.5 rounded-full border border-[#e4d2a8]/40 bg-[#211a28]/95 px-4 py-2.5 text-xs font-medium text-[#f2ebf7] shadow-2xl backdrop-blur-md transition-all hover:border-[#e4d2a8] hover:scale-105 hover:bg-[#2d2338]"
          >
            {/* Concierge Icon / Avatar */}
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#e4d2a8] text-[#211a28] shadow">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <span>How can I help you?</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowConcierge(false)}
            aria-label="Dismiss chat widget"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs text-[#f2ebf7] hover:bg-black/80"
          >
            ×
          </button>
        </aside>
      )}

      {/* Interactive Concierge Assistance Modal */}
      {conciergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[#ecdcd5] bg-[#fffaf5] p-6 text-[#221c25] shadow-2xl">
            <button
              type="button"
              onClick={() => setConciergeModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f2e6e1] text-base font-bold text-[#832729] hover:bg-[#e6d5ce] transition"
            >
              ×
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4b3a5e] text-white font-serif text-xl font-bold shadow">
                AN
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#4b3a5e]">
                  AurNya Jewellery Concierge
                </h3>
                <p className="text-xs font-semibold text-[#665750]">
                  Online · Dedicated Personal Stylist
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium leading-relaxed text-[#2e2632]">
                Namaste! Welcome to AurNya. Our diamond and gold jewellery specialists are available 24/7 to assist with ring sizing, custom gifting, tracking orders, or certificate authentication.
              </p>

              <div className="rounded-xl border border-[#e8cbbe] bg-[#fbf2ed] p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4b3a5e]">Toll-Free Helpline:</span>
                  <a href="tel:18002660123" className="font-bold text-[#1f1a24] underline hover:text-[#4b3a5e]">1800-266-0123</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4b3a5e]">WhatsApp Specialist:</span>
                  <a href="https://wa.me/918147349242" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-800 underline hover:text-emerald-950">+91 8147349242</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4b3a5e]">Email Support:</span>
                  <a href="mailto:concierge@aurnya.com" className="font-bold text-[#1f1a24] underline hover:text-[#4b3a5e]">concierge@aurnya.com</a>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <a
                  href="https://wa.me/918147349242?text=Hello%20AurNya%2C%20I%20would%20like%20assistance%20with%20jewellery%20selection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-[#25D366] py-3 text-center text-xs font-bold text-white shadow hover:bg-[#20ba59] transition"
                >
                  Start WhatsApp Chat →
                </a>
                <button
                  type="button"
                  onClick={() => setConciergeModalOpen(false)}
                  className="rounded-xl border border-[#d6c7bf] bg-[#f0e6e1] px-5 py-3 text-xs font-bold text-[#1f1a24] hover:bg-[#e4d4cd] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
