import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { verifyStandardWebhook, WebhookVerifyError } from '@/lib/email/webhook-verify.server'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

// Template mapping
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Configuration
const SITE_NAME = "purplelife"
const SENDER_DOMAIN = "notify.purplelife.org"
const ROOT_DOMAIN = "purplelife.org"
const FROM_DOMAIN = "notify.purplelife.org"

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}

// Supabase Auth "send email" hook payload (Standard Webhooks signed).
interface SupabaseEmailHookPayload {
  user?: { email?: string }
  email_data?: {
    token?: string
    token_hash?: string
    redirect_to?: string
    email_action_type?: string
    site_url?: string
    new_email?: string
  }
}

export const Route = createFileRoute("/api/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Secret from the Supabase dashboard (Auth > Hooks > Send Email).
        const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET

        if (!hookSecret) {
          console.error('SEND_EMAIL_HOOK_SECRET not configured')
          return Response.json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        // Verify signature + timestamp, then parse payload.
        let payload: SupabaseEmailHookPayload
        try {
          const body = await verifyStandardWebhook(request, hookSecret)
          payload = JSON.parse(body) as SupabaseEmailHookPayload
        } catch (error) {
          if (error instanceof WebhookVerifyError) {
            console.error('Invalid webhook signature', { code: error.code })
            return Response.json({ error: 'Invalid signature' }, { status: 401 })
          }
          console.error('Invalid webhook payload', { error })
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        const emailData = payload.email_data
        const recipient = payload.user?.email
        const emailType = emailData?.email_action_type ?? ''

        if (!emailData || !recipient || !emailType) {
          console.error('Webhook payload missing user email or email_data')
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        console.log('Received auth event', {
          emailType,
          email_redacted: redactEmail(recipient),
        })

        const EmailTemplate = EMAIL_TEMPLATES[emailType]
        if (!EmailTemplate) {
          console.error('Unknown email type', { emailType })
          return Response.json(
            { error: `Unknown email type: ${emailType}` },
            { status: 400 }
          )
        }

        // Build the verification URL from the token hash. Supabase's GoTrue
        // endpoint completes the flow and then redirects to redirect_to.
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('Missing Supabase environment variables')
          return Response.json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        const verifyUrl = new URL(`${supabaseUrl}/auth/v1/verify`)
        verifyUrl.searchParams.set('token', emailData.token_hash ?? '')
        verifyUrl.searchParams.set('type', emailType)
        verifyUrl.searchParams.set(
          'redirect_to',
          emailData.redirect_to || emailData.site_url || `https://${ROOT_DOMAIN}/`,
        )

        const templateProps = {
          siteName: SITE_NAME,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient,
          confirmationUrl: verifyUrl.toString(),
          token: emailData.token,
          email: recipient,
          oldEmail: recipient,
          newEmail: emailData.new_email,
        }

        // Render React Email to HTML and plain text
        const element = React.createElement(EmailTemplate, templateProps)
        const html = await render(element)
        const text = await render(element, { plainText: true })

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const messageId = crypto.randomUUID()

        // Log pending BEFORE enqueue so we have a record even if enqueue crashes
        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: recipient,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'auth_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: EMAIL_SUBJECTS[emailType] || 'Notification',
            html,
            text,
            purpose: 'transactional',
            label: emailType,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('Failed to enqueue auth email', { error: enqueueError, emailType })
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: recipient,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          return Response.json(
            { error: 'Failed to enqueue email' },
            { status: 500 }
          )
        }

        console.log('Auth email enqueued', {
          emailType,
          email_redacted: redactEmail(recipient),
        })

        return Response.json({ success: true, queued: true })
      },
    },
  },
})
