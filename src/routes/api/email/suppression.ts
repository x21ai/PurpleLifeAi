import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { verifyStandardWebhook, WebhookVerifyError } from '@/lib/email/webhook-verify.server'

// Resend webhook events (svix-signed, Standard Webhooks scheme).
// We subscribe to email.bounced and email.complained; everything else is
// acknowledged and ignored. Unsubscribes are handled by /email/unsubscribe.
interface ResendWebhookEvent {
  type: string
  data?: {
    email_id?: string
    to?: string[] | string
    bounce?: { type?: string; subType?: string }
  }
}

function mapEventToReason(type: string): 'bounce' | 'complaint' | null {
  switch (type) {
    case 'email.bounced':
      return 'bounce'
    case 'email.complained':
      return 'complaint'
    default:
      return null
  }
}

function mapReasonToStatus(reason: string): 'bounced' | 'complained' {
  return reason === 'bounce' ? 'bounced' : 'complained'
}

function mapReasonToMessage(reason: string): string {
  return reason === 'bounce'
    ? 'Permanent bounce, email address is invalid or rejected'
    : 'Spam complaint, recipient marked email as spam'
}

export const Route = createFileRoute("/api/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        let event: ResendWebhookEvent
        try {
          const body = await verifyStandardWebhook(request, webhookSecret)
          event = JSON.parse(body) as ResendWebhookEvent
        } catch (error) {
          if (error instanceof WebhookVerifyError) {
            console.error('Invalid webhook signature', { code: error.code })
            return Response.json({ error: 'Invalid signature' }, { status: 401 })
          }
          console.error('Invalid webhook payload', { error })
          return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const reason = mapEventToReason(event.type)
        if (!reason) {
          // Not a suppression-relevant event; acknowledge so Resend stops retrying.
          return Response.json({ success: true, ignored: event.type })
        }

        // Soft bounces are transient; only suppress permanent failures.
        if (reason === 'bounce' && event.data?.bounce?.type === 'Transient') {
          return Response.json({ success: true, ignored: 'transient_bounce' })
        }

        const to = event.data?.to
        const recipient = Array.isArray(to) ? to[0] : to
        if (!recipient) {
          console.error('Suppression event missing recipient', { type: event.type })
          return Response.json({ error: 'Missing recipient' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const normalizedEmail = recipient.toLowerCase()

        // 1. Upsert to suppressed_emails (idempotent, safe for retries)
        const { error: suppressError } = await supabase
          .from('suppressed_emails')
          .upsert(
            {
              email: normalizedEmail,
              reason,
              metadata: event.data ?? null,
            },
            { onConflict: 'email' },
          )

        if (suppressError) {
          console.error('Failed to upsert suppressed email', {
            error: suppressError,
            email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          })
          return Response.json({ error: 'Failed to write suppression' }, { status: 500 })
        }

        // 2. Append a new log entry for the suppression event (never update existing rows)
        const { error: insertError } = await supabase
          .from('email_send_log')
          .insert({
            message_id: event.data?.email_id ?? null,
            template_name: 'system',
            recipient_email: normalizedEmail,
            status: mapReasonToStatus(reason),
            error_message: mapReasonToMessage(reason),
            metadata: event.data ?? null,
          })

        if (insertError) {
          // Non-fatal, log and continue. The suppression was already recorded.
          console.warn('Failed to insert email_send_log', {
            error: insertError,
          })
        }

        console.log('Suppression processed', {
          email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          reason,
          event_type: event.type,
        })

        return Response.json({ success: true })
      },
    },
  },
})
