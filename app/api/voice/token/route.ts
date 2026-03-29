import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('ipl_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    jwt.verify(token, process.env.JWT_SECRET!)

    const { roomId, userId, userName } = await req.json()
    if (!roomId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity: userId, name: userName }
    )

    at.addGrant({
      roomJoin:    true,
      room:        `ipl-${roomId}`,
      canPublish:  true,
      canSubscribe: true,
    })

    return NextResponse.json({
      token: await at.toJwt(),
      url:   process.env.NEXT_PUBLIC_LIVEKIT_URL!,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
