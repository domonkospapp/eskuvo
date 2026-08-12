import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = '/tmp/eskuvo-data'
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadGuests() {
  ensureDataDir()
  try {
    if (fs.existsSync(GUESTS_FILE)) {
      const data = fs.readFileSync(GUESTS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading guests:', error)
  }
  return {}
}

function saveGuests(guests: Record<string, any>) {
  ensureDataDir()
  try {
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2))
  } catch (error) {
    console.error('Error saving guests:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing key or value' },
        { status: 400 }
      )
    }

    const guests = loadGuests()
    guests[key] = value
    saveGuests(guests)

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
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')
    const list = searchParams.get('list') === 'true'

    const guests = loadGuests()

    if (list) {
      const keys = Object.keys(guests)
      return NextResponse.json({ keys })
    }

    if (key) {
      const value = guests[key]
      if (value !== undefined) {
        return NextResponse.json({ value })
      }
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error in GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
