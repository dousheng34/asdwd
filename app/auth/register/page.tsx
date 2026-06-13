'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Supabase may require email confirmation depending on project settings.
    // Show a success message; redirect after a short delay.
    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md bg-zinc-900/20 border-white/5 shadow-2xl text-center">
          <CardContent className="p-10 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Account Created!</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Check your email for a confirmation link, then sign in to start trading.
            </p>
            <p className="text-[10px] text-zinc-600">Redirecting to login in 3 seconds...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-20 relative">
      <Card className="w-full max-w-md bg-zinc-900/20 border-white/5 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 flex mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-white">Create an Account</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Sign up to buy and sell items with secure escrow protection.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold text-zinc-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="gamer123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 pl-9 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>
            </div>
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
              <Label htmlFor="password" className="text-xs font-semibold text-zinc-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
              {loading ? 'Registering...' : 'Create Account'}
            </Button>
            <div className="text-center text-xs text-zinc-500">
              {'Already have an account? '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
