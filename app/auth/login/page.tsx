'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Mail, Lock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { useTranslation } from '@/lib/i18n'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const at = t('auth')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const errParam = searchParams.get('error')
    if (errParam === 'confirmation_failed') {
      setError(at.errorConfirmationFailed)
    } else if (errParam === 'oauth_failed') {
      setError(at.errorOauthFailed)
    }
    if (searchParams.get('confirmed') === '1') {
      setInfo(at.successConfirmed)
    }
  }, [searchParams, at])

  const getLocalizedError = (message: string) => {
    const msg = message.toLowerCase()
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return at.errorInvalidCredentials
    }
    if (msg.includes('email not confirmed')) {
      return at.errorEmailNotConfirmed
    }
    return message
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(getLocalizedError(authError.message))
      setLoading(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      
      {/* Dev helper message */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-primary/20 shadow-lg text-[11px] text-zinc-400 space-y-2">
        <h4 className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
          <Info className="h-3.5 w-3.5" />
          {at.devHintTitle}
        </h4>
        <p className="leading-relaxed">
          {at.devHintDesc}
        </p>
      </div>

      <Card className="bg-zinc-900/20 border-white/5 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 flex mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-white">{at.welcomeBack}</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            {at.loginDesc}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {info && (
              <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                {info}
              </div>
            )}
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-300">{at.emailLabel}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder={at.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 pl-9 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-zinc-300">{at.passwordLabel}</Label>
                <Link href="#" className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  {at.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder={at.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 pl-9 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)] text-xs h-10 transition-all cursor-pointer"
            >
              {loading ? at.authenticating : at.signInBtn}
            </Button>
            <div className="text-center text-xs text-zinc-500">
              {at.dontHaveAccount}{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                {at.signUpNow}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex-grow flex items-center justify-center px-4 py-12 md:py-20 relative">
      <Suspense fallback={
        <div className="w-full max-w-md h-80 rounded-xl bg-zinc-900/20 border border-white/5 animate-pulse" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
