import type { ComponentType } from 'react'
import { template as careInviteTemplate } from './care-invite'
import { template as caregiverWriteNoticeTemplate } from './caregiver-write-notice'
import { template as caregiverProposalDecisionTemplate } from './caregiver-proposal-decision'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'care-invite': careInviteTemplate,
  'caregiver-write-notice': caregiverWriteNoticeTemplate,
  'caregiver-proposal-decision': caregiverProposalDecisionTemplate,
}
