import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };

    if (username === 'superadmin' && password === 'password') {
      return NextResponse.json({ access_token: 'demo-token' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
