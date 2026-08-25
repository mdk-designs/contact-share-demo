/**
 * ─────────────────────────────────────────
 *  CARD OWNER CONFIGURATION
 *  Edit this file to personalise the card.
 * ─────────────────────────────────────────
 */
export const CARD_CONFIG = {
  // Identity
  firstName: 'Deepak',
  lastName: 'Kumar',
  scriptAccent: 'Deepak',
  title: 'UI/UX Engineer & Product Designer',
  organization: 'DesignForge Studio',
  companyTagline: 'Product Design & Strategy',
  companyInitials: 'DF',

  // Contact
  phone: '+919876543210',        // E.164 format for WhatsApp link
  phoneDisplay: '+91 98765 43210', // Human-readable
  email: 'deepak@designforge.studio',
  website: 'https://deepak.design',
  location: 'Bengaluru, India',

  // Social
  linkedIn: 'https://linkedin.com/in/deepakkumar',
  github: 'https://github.com/deepakkumar',
  twitter: 'https://twitter.com/deepakkdesign',

  // WhatsApp (uses E.164 phone without +)
  whatsappMessage: 'Hi Deepak! I just saved your contact and wanted to connect.',

  // QR code points to the card's live URL
  qrUrl: 'https://app-amber-phi-95.vercel.app',

  // vCard filename (served by /api/contact.vcf)
  vcfFilename: 'Deepak_Kumar.vcf',
}

export type CardConfig = typeof CARD_CONFIG
