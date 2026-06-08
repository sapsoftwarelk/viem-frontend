import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (auth === 'Bearer demo-token') {
    return NextResponse.json({ user: { username: 'superadmin', role: 'admin' } }, { status: 200 });
  }
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
