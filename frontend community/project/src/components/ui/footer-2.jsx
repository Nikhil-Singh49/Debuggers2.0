import {
  Globe,
  Mail,
  Send,
  Share2,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button.jsx';
import { PlayStoreButton } from '@/components/ui/play-store-button.jsx';
import { AppStoreButton } from '@/components/ui/app-store-button.jsx';

const footerLinks = [
  {
    title: 'Company',
    links: [
      { href: '#', label: 'The Linomore Blog' },
      { href: '#', label: 'Engineering Blog' },
      { href: '#', label: 'Marketplace' },
      { href: '#', label: 'What’s New' },
      { href: '#', label: 'About' },
      { href: '#', label: 'Press' },
      { href: '#', label: 'Careers' },
      { href: '#', label: 'Link in Bio' },
      { href: '#', label: 'Social Good' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: '#', label: 'Linktree for Enterprise' },
      { href: '#', label: '2023 Creator Report' },
      { href: '#', label: '2022 Creator Report' },
      { href: '#', label: 'Charities' },
      { href: '#', label: 'What’s Trending' },
      { href: '#', label: 'Creator Profile Directory' },
      { href: '#', label: 'Explore Templates' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '#', label: 'Help Topics' },
      { href: '#', label: 'Getting Started' },
      { href: '#', label: 'Linoree Pro' },
      { href: '#', label: 'Features & How-tos' },
      { href: '#', label: 'FAQs' },
      { href: '#', label: 'Report a Violation' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '#', label: 'Terms & Conditions' },
      { href: '#', label: 'Privacy Notice' },
      { href: '#', label: 'Cookie Notice' },
      { href: '#', label: 'Trust Center' },
      { href: '#', label: 'Cookie Preferences' },
      { href: '#', label: 'Transparency Report' },
      { href: '#', label: 'Law Enforcement Access Policy' },
    ],
  },
];

const socialLinks = [
  { icon: Globe, href: '#' },
  { icon: Mail, href: '#' },
  { icon: Send, href: '#' },
  { icon: Share2, href: '#' },
];

export function Footer2() {
  return (
    <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="grid grid-cols-2 gap-8 py-8 md:grid-cols-4">
          {footerLinks.map((item, i) => (
            <div key={i}>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-700">{item.title}</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                {item.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition-colors hover:text-blue hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-px bg-slate-200" />

        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-2">
            {socialLinks.map(({ icon: Icon, href }, i) => (
              <a
                href={href}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'icon',
                })}
                key={i}
              >
                <Icon className="size-5 text-slate-500 transition-colors duration-300 hover:text-blue" />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#">
              <AppStoreButton />
            </a>

            <a href="#">
              <PlayStoreButton />
            </a>
          </div>
        </div>

        <div className="h-px bg-slate-200" />
        <div className="py-4 text-center text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()}{' '}
            <a href="https://x.com/sshahaider" className="font-semibold text-slate-700 hover:text-blue hover:underline">
              sshahaider
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer2;
