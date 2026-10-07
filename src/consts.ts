import type {
  FooterContent,
  IconMap,
  LandingContent,
  Profile,
  SocialLink,
  Site,
} from '@/types'
import { resolveSiteUrl } from '@/lib/site-config'

const SITE_URL = resolveSiteUrl({
  ...process.env,
  ...(import.meta.env ?? {}),
})

// ─────────────────────────────────────────────────────────────
// SITE IDENTITY — cybersecurity blog & challenge lab
// TODO: swap the placeholder email + socials to your real ones.
// ─────────────────────────────────────────────────────────────

export const SITE: Site = {
  title: 'YXN // Security Lab',
  description:
    'Hands-on cybersecurity: exploit development walkthroughs, CTF write-ups, detection engineering notes, and interactive lab challenges.',
  href: SITE_URL,
  author: 'YXN',
  locale: 'en-US',
  featuredPostCount: 3,
  postsPerPage: 3,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/about',
    label: 'about',
  },
  {
    href: '/blog',
    label: 'write-ups',
  },
]

export const PROFILE: Profile = {
  summary:
    'Security researcher documenting the full kill chain — recon, exploitation, privilege escalation, and the detections that catch it. Every write-up ships with a reproducible lab.',
  about: [
    'I treat offensive security as a discipline of understanding: break it in the lab, document the exact mechanism, then write the detection that would have caught it.',
    'This site is the working notebook — CTF solutions, exploit development walkthroughs, reverse engineering notes, and challenge labs built for practitioners who want reproducible proof, not theory.',
  ],
  links: [
    {
      href: 'https://github.com/Ducksss',
      label: 'GitHub',
      note: 'Exploits, tooling, and lab repositories.',
    },
    // TODO: replace with your real contact address
    {
      href: 'mailto:contact@yourdomain.com',
      label: 'Email',
      note: 'Responsible disclosure, CTF team invites, and collaborations.',
    },
  ],
  facts: [
    {
      label: 'Focus',
      value: 'Offensive security & detection engineering',
    },
    {
      label: 'Lab',
      value: 'Kali Linux // isolated target networks',
    },
    {
      label: 'Currently',
      value: 'CTF challenges, exploit demos, and exam prep content',
    },
    {
      label: 'Disclosure',
      value: 'Responsible — coordinated, patched, then published',
    },
  ],
  metrics: [
    {
      value: '24/7',
      label: 'Lab availability',
    },
    {
      value: '100%',
      label: 'Write-ups reproducible',
    },
    {
      value: '0',
      label: 'Shortcuts taken',
    },
    {
      value: 'root',
      label: 'Expected shell',
    },
  ],
  hackathonStats: [
    {
      value: 'CTF',
      label: 'Challenge format',
    },
    {
      value: 'pwn',
      label: 'Favorite category',
    },
    {
      value: 'crypto',
      label: 'Currently studying',
    },
  ],
  experience: [
    // TODO: personalize with your own roles & timeline
    {
      id: 'security-lab',
      company: 'Independent Security Lab',
      role: 'Researcher & Author',
      period: 'Ongoing',
      timelineSummary:
        'Building reproducible attack labs and documenting the full exploitation path for every technique covered on the site.',
      caseStudyContext:
        'Every lab is built twice: once to break it, once to detect the break. The write-up is the handoff between the two.',
      highlights: [
        'Designed isolated target networks for safe exploitation practice.',
        'Authored step-by-step exploit walkthroughs with working payloads.',
        'Paired every offensive technique with a detection or hardening note.',
      ],
      tags: [
        'Exploit development',
        'CTF',
        'Detection engineering',
        'Kali Linux',
      ],
      featured: true,
    },
  ],
  education: [
    // TODO: personalize
    {
      institution: 'Self-directed security research',
      degree: 'Offensive & defensive security',
      period: 'Ongoing',
      details: [
        'CTF platforms, home labs, and published write-ups.',
      ],
    },
  ],
  awards: [
    // TODO: personalize
    'CTF placements & challenge completions',
  ],
  hackathonWins: [
    // TODO: personalize
  ],
  initiatives: [
    {
      name: 'Security Challenge Lab',
      role: 'Author & Operator',
      period: 'Ongoing',
      summary:
        'Interactive CTF-style challenges and exam prep quizzes hosted on this site, paired with full write-ups.',
      highlights: [
        'Hands-on challenges across web, crypto, forensics, and pwn.',
        'Timed quizzes for certification-style practice.',
        'Every challenge has a published solution path.',
      ],
      tags: [
        'CTF',
        'Quizzes',
        'Hands-on labs',
      ],
    },
  ],
  leadership: [
    // TODO: personalize
  ],
  skills: [
    {
      label: 'Offense',
      items: ['Exploit development', 'Web exploitation', 'Privilege escalation', 'OSINT'],
    },
    {
      label: 'Defense',
      items: ['Detection engineering', 'Incident response', 'Hardening', 'Threat modeling'],
    },
    {
      label: 'Tooling',
      items: ['Kali Linux', 'Burp Suite', 'Metasploit', 'Wireshark', 'Ghidra', 'Python', 'Bash'],
    },
    {
      label: 'Platforms',
      items: ['HackTheBox', 'TryHackMe', 'picoCTF', 'Custom labs'],
    },
  ],
  certifications: [
    // TODO: personalize
    'Certification prep content in progress',
  ],
}

export const LANDING: LandingContent = {
  name: 'YXN',
  monogram: 'YXN',
  eyebrow: 'Exploit development // CTF write-ups // detection engineering',
  description:
    'Security write-ups and lab challenges documenting the full path: recon, exploitation, escalation, and the detections that catch it.',
  manifesto:
    'Break it in the lab. Understand the mechanism. Write the detection. Publish the proof.',
  featuredWorkTitle: 'Proof across exploitation, detection, and tooling.',
  featuredWorkIntro:
    'Three proof blocks: hands-on exploitation, the detections that catch it, and the tooling that makes both reproducible.',
  archiveTitle: 'Write-ups that show the work.',
  archiveIntro:
    'Every solution keeps its proof trail visible: the recon, the payload, the crash, the shell, and the fix.',
  primaryLink: {
    href: 'mailto:contact@yourdomain.com',
    label: 'Responsible disclosure',
    note: 'Found something? Coordinated disclosure welcome.',
  },
  secondaryLink: {
    href: '/about',
    label: 'Methodology & lab setup',
    note: 'How the labs are built and why the write-ups look like this',
  },
  marqueeLines: [
    'Exploit development',
    'CTF write-ups',
    'Red team tradecraft',
    'Detection engineering',
    'Reverse engineering',
    'Privilege escalation',
  ],
  capabilityLines: [
    {
      label: '01',
      title: 'Offense',
    },
    {
      label: '02',
      title: 'Defense',
    },
    {
      label: '03',
      title: 'Tooling',
    },
  ],
}

const currentYear = new Date().getFullYear()
const emailLink = PROFILE.links.find((item) => item.label === 'Email')
const githubLink = PROFILE.links.find((item) => item.label === 'GitHub')
const emailAddress =
  emailLink?.href.replace(/^mailto:/, '') ?? 'contact@yourdomain.com'

export const FOOTER: FooterContent = {
  eyebrow: 'Contact // Responsible disclosure',
  headline:
    'Found a flaw? Solving a CTF? The lab is open.',
  copy: PROFILE.summary,
  primaryContact: {
    href: emailLink?.href ?? 'mailto:contact@yourdomain.com',
    label: emailAddress,
  },
  baseLabel: 'Base',
  baseValue: 'Isolated labs // Kali Linux',
  linksLabel: 'Links',
  contactLinks: [
    {
      href: emailLink?.href ?? 'mailto:contact@yourdomain.com',
      label: 'Email',
    },
    {
      href: githubLink?.href ?? 'https://github.com/Ducksss',
      label: 'GitHub',
    },
    {
      href: '/rss.xml',
      label: 'RSS',
    },
    {
      href: '/signal-room/ascii-signal',
      label: 'ASCII Playground',
    },
  ],
  signature: `${LANDING.name} / ${currentYear}`,
}

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
