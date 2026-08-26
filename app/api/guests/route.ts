import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { createHash, timingSafeEqual } from 'crypto'

const ADMIN_TOKEN_HASH = 'd01c18aff37f7ad9bb77d01e3222e4c6bb1a9c4987ebaae8e20c10a270651e4e'

function isValidToken(provided: string | null) {
  if (!provided) return false
  const providedHash = createHash('sha256').update(provided).digest()
  const expectedHash = Buffer.from(ADMIN_TOKEN_HASH, 'hex')
  return providedHash.length === expectedHash.length && timingSafeEqual(providedHash, expectedHash)
}

function isAuthorized(request: NextRequest) {
  return isValidToken(request.headers.get('x-admin-token'))
}

async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase()

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing key or value' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO guests (key, value)
      VALUES (${key}, ${value}::jsonb)
      ON CONFLICT (key) DO NOTHING
    `

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Key already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await initDatabase()

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')
    const list = searchParams.get('list') === 'true'
    const verify = searchParams.get('verify') === 'true'

    if (verify) {
      return NextResponse.json({ authorized: isAuthorized(request) })
    }

    if (list) {
      const result = await sql`SELECT key FROM guests ORDER BY created_at ASC`
      const keys = result.rows.map((row: any) => row.key)
      return NextResponse.json({ keys })
    }

    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (key) {
      const result = await sql`SELECT value FROM guests WHERE key = ${key}`
      if (result.rows.length > 0) {
        return NextResponse.json({ value: result.rows[0].value })
      }
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      )
    }

    const result = await sql`SELECT key, value FROM guests`
    const guests: Record<string, any> = {}
    result.rows.forEach((row: any) => {
      guests[row.key] = row.value
    })
    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error in GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
