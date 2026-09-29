'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Key,
  Copy,
  Check,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function MemberSettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [chatIdInput, setChatIdInput] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [botStatus, setBotStatus] = useState<{
    telegram_configured: boolean
    bot_username: string | null
    instructions?: string
  } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [copiedEnv, setCopiedEnv] = useState(false)

  // Fetch bot webhook status
  const checkBot = async () => {
    setCheckingStatus(true)
    try {
      const res = await fetch('/api/telegram/webhook')
      if (res.ok) {
        const data = await res.json()
        setBotStatus(data)
      }
    } catch (err) {
      console.warn('Webhook status check failed:', err)
    } finally {
      setCheckingStatus(false)
    }
  }

  useEffect(() => {
    checkBot()
  }, [])

  useEffect(() => {
    if (profile?.telegram_chat_id) {
      setChatIdInput(profile.telegram_chat_id)
    }
  }, [profile?.telegram_chat_id])

  const handleSaveChatId = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return

    setSaving(true)
    try {
      const client = getSupabaseClient()
      if (client) {
        const { error } = await client
          .from('profiles')
          .update({ telegram_chat_id: chatIdInput.trim() || null })
          .eq('id', profile.id)

        if (error) throw error
        await refreshProfile()
        toast.success('Telegram chat ID saved successfully!')
      } else {
        toast.success('Telegram preference updated locally!')
      }
    } catch (err: any) {
      toast.error('Failed to update Telegram ID', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleCopyEnvSample = () => {
    const sample = `TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"\nNEXT_PUBLIC_TELEGRAM_BOT="YourBotUsername"`
    navigator.clipboard.writeText(sample)
    setCopiedEnv(true)
    toast.success('Environment variables copied to clipboard!')
    setTimeout(() => setCopiedEnv(false), 2000)
  }

  const isLinked = Boolean(profile?.telegram_chat_id && profile.telegram_chat_id.length > 0)
  const botConfigured = Boolean(botStatus?.telegram_configured)
  const botUser = botStatus?.bot_username

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Telegram &amp; Integrations
            </h1>
            <Badge
              variant={isLinked ? 'mint' : 'outline'}
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              {isLinked ? 'Telegram Linked' : 'Provision Ready'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Connect your Telegram account to receive instant contact cards (.vcf) whenever visitors scan your QR code.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={checkBot}
          disabled={checkingStatus}
          className="rounded-xl text-xs border-[var(--border-card)] shadow-xs"
        >
          <RefreshCw size={13} className={`mr-1.5 ${checkingStatus ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </Button>
      </div>

      {/* Telegram Status & Provision Banner */}
      <Card className="rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-emerald-500/10 p-6 sm:p-8 border-b border-[var(--border-subtle)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
              <Send size={22} className="-rotate-12" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {botConfigured ? 'Telegram Bot Active' : 'Telegram Bot Provision Ready'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                {botConfigured
                  ? `Connected to @${botUser}. When public scanners exchange their contact info, both you and the scanner will receive reciprocal .vcf cards.`
                  : 'The entire Telegram vCard sharing architecture (webhook, deep linking, reverse vCard generation) is deployed and provisioned in your code. You can create your bot whenever you are ready.'}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* If Bot is configured: Show 1-Click Connect Button */}
          {botConfigured && botUser ? (
            <div className="rounded-2xl border border-sky-200/60 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                  Instant Telegram Linking
                </span>
                <span className="text-xs font-mono text-sky-600 dark:text-sky-400">@{botUser}</span>
              </div>
              <p className="text-xs text-sky-700 dark:text-sky-300/80">
                Click the button below to open Telegram. Tap <b>Start</b> in the bot conversation to instantly pair your profile.
              </p>
              <Button
                asChild
                className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-md"
              >
                <a
                  href={`https://t.me/${botUser}?start=user_${profile?.user_id || profile?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send size={13} className="mr-1.5" />
                  <span>Pair with @{botUser}</span>
                  <ExternalLink size={12} className="ml-1.5 opacity-80" />
                </a>
              </Button>
            </div>
          ) : (
            /* Bot Provision Setup Guide (For when user creates bot in the future) */
            <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Step-by-Step Provision Guide
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300 dark:border-indigo-700">
                  Awaiting Token
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] space-y-1">
                  <span className="font-bold text-indigo-600">1. Open @BotFather</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    In Telegram, search for <b>@BotFather</b> and send <code>/newbot</code>.
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] space-y-1">
                  <span className="font-bold text-indigo-600">2. Copy Token</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    BotFather will reply with your HTTP API access token.
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] space-y-1">
                  <span className="font-bold text-indigo-600">3. Save in .env.local</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Paste the token into your app&apos;s environment file. Done!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono">
                  TELEGRAM_BOT_TOKEN &amp; NEXT_PUBLIC_TELEGRAM_BOT
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEnvSample}
                  className="rounded-lg h-7 px-2.5 text-[11px] border-indigo-200 dark:border-indigo-800"
                >
                  {copiedEnv ? <Check size={12} className="text-emerald-500 mr-1" /> : <Copy size={12} className="mr-1" />}
                  <span>{copiedEnv ? 'Copied' : 'Copy Sample'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Manual Telegram Chat ID Entry */}
          <form onSubmit={handleSaveChatId} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="telegram_chat_id" className="text-xs font-semibold text-[var(--text-secondary)]">
                Your Telegram Chat ID (Direct Input)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="telegram_chat_id"
                  type="text"
                  placeholder="e.g. 123456789"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  className="rounded-xl bg-[var(--bg-input)] border-[var(--border-card)] text-sm font-mono"
                />
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shrink-0 shadow-xs"
                >
                  {saving ? 'Saving…' : 'Save ID'}
                </Button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                You can get your Telegram Chat ID anytime by messaging <b>@userinfobot</b> on Telegram.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
