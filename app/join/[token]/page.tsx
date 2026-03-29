'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Trophy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function JoinByLinkPage() {
  const params = useParams()
  const router = useRouter()
  const token  = params.token as string
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const join = async () => {
      try {
        const res  = await fetch(`/api/rooms/join-link/${token}`, { method: 'POST' })
        const json = await res.json()

        if (!res.ok) {
          setError(json.error ?? 'Invalid invite link')
          return
        }

        toast.success(`Joining ${json.room.name}! 🏏`)
        router.push(`/room/${json.room.id}`)
      } catch {
        setError('Something went wrong')
      }
    }
    join()
  }, [token, router])

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 text-center space-y-6 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto">
          {error
            ? <AlertCircle className="w-8 h-8 text-crimson" />
            : <Trophy className="w-8 h-8 text-gold" />
          }
        </div>

        {error ? (
          <>
            <div>
              <h2 className="font-display text-3xl text-crimson">Invalid Link</h2>
              <p className="text-text-secondary mt-2">{error}</p>
            </div>
            <button onClick={() => router.push('/lobby')} className="btn-gold w-full">
              Back to Lobby
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="font-display text-3xl text-text-primary">Joining Room…</h2>
              <p className="text-text-secondary mt-2">Please wait while we get you in</p>
            </div>
            <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto" />
          </>
        )}
      </div>
    </div>
  )
}
