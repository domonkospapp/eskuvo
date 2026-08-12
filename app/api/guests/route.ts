import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

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

    await sql`
      INSERT INTO guests (key, value)
      VALUES (${key}, ${value}::jsonb)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value
    `

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

    if (list) {
      const result = await sql`SELECT key FROM guests ORDER BY created_at ASC`
      const keys = result.rows.map((row: any) => row.key)
      return NextResponse.json({ keys })
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
