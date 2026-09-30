import type { Profile } from './supabase'

/**
 * PublicProfile DTO — strictly strips all private/internal fields
 * such as user_id, telegram_chat_id, internal role, or sensitive admin metadata.
 */
export interface PublicProfileDTO {
  id?: string
  slug: string
  firstName: string
  lastName: string
  headline?: string
  jobTitle?: string
  companyName?: string
  department?: string
  workEmail?: string
  workPhone?: string
  mobilePhone?: string
  websiteUrl?: string
  address?: string
  bio?: string
  avatarUrl?: string
  coverImageUrl?: string
  socialLinks?: Record<string, string>
  cardTheme?: {
    primaryColor?: string
    accentColor?: string
    template?: string
  }
}

/**
 * Sanitizes an internal Profile object into a secure, public-safe DTO.
 */
export function toPublicProfileDTO(profile: Profile | null | undefined): PublicProfileDTO | null {
  if (!profile || !profile.is_active) {
    return null
  }

  return {
    id: profile.id,
    slug: profile.slug,
    firstName: profile.first_name,
    lastName: profile.last_name,
    headline: profile.headline,
    jobTitle: profile.job_title,
    companyName: profile.company_name,
    department: profile.department,
    workEmail: profile.work_email,
    workPhone: profile.work_phone,
    mobilePhone: profile.mobile_phone,
    websiteUrl: profile.website_url,
    address: profile.address,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    coverImageUrl: profile.cover_image_url,
    socialLinks: (profile.social_links as Record<string, string>) || {},
    cardTheme: profile.card_theme,
  }
}
