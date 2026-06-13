'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'

// Inner component — uses useSearchParams (must be inside Suspense)
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const errParam = searchParams.get('error')
    if (errParam === 'confirmation_failed') {
      setError('Email confirmation failed. The link may have expired. Please try registering again.')
    } else if (errParam === 'oauth_failed') {
      setError('Sign in failed. Please try again.')
    }
    if (searchParams.get('confirmed') === '1') {
      setInfo('Email confirmed! You can now sign in.')
    }
  }, [searchParams])

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
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md bg-zinc-900/20 border-white/5 shadow-2xl relative z-10">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 flex mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-white">Welcome Back</CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Sign in to access your dashboard and active trades.
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
            <Label htmlFor="email" className="text-xs font-semibold text-zinc-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950/40 border-white/5 pl-9 text-xs focus-visible:ring-primary/50 text-zinc-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-zinc-300">Password</Label>
              <Link href="#" className="text-[10px] text-zinc-500 hover:text-zinc-300">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
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
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(255,87,34,0.2)] text-xs h-10 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
          <div className="text-center text-xs text-zinc-500">
            {"Don't have an account? "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

// Outer page — wraps LoginForm in Suspense (required by Next.js for useSearchParams)
export default function LoginPage() {
  return (
    <div className="flex-grow flex items-center justify-center px-4 py-20 relative">
      <Suspense fallback={
        <div className="w-full max-w-md h-80 rounded-xl bg-zinc-900/20 border border-white/5 animate-pulse" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
