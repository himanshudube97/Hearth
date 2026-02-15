import * as jose from 'jose'
import { DEV_JWT_SECRET } from './config'

export interface DevUser {
  id: string
  email: string
  name: string
}

export interface DevTokenPayload {
  sub: string
  email: string
  name: string
  iat: number
  exp: number
}

const secret = new TextEncoder().encode(DEV_JWT_SECRET)

export async function createDevToken(user: DevUser): Promise<string> {
  const token = await new jose.SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

export async function verifyDevToken(token: string): Promise<DevTokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    }
  } catch {
    return null
  }
}
