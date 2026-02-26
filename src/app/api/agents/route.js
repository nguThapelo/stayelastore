import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { captureServerError } from '@/lib/sentry';

export async function GET() {
  try {
    const firebase = getFirebaseAdmin();

    if (firebase.configured) {
      const snapshot = await firebase.db.collection('agents').orderBy('cashFlow', 'desc').limit(20).get();

      const rows = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: doc.id,
          rank: index + 1,
          storeName: data.storeName || 'Store',
          location: data.gautengLocation || 'Gauteng',
          cashFlow: `R${Number(data.cashFlow || 0).toLocaleString('en-ZA')}`,
          creditScore: Number(data.creditScore || 300),
        };
      });

      return NextResponse.json({ success: true, data: rows });
    }

    return NextResponse.json({
      success: true,
      data: [
        { id: 'demo-1', rank: 1, storeName: 'Mofolo Fresh Mart', location: 'Soweto', cashFlow: 'R8,500', creditScore: 642 },
        { id: 'demo-2', rank: 2, storeName: 'Tembisa Daily Needs', location: 'Tembisa', cashFlow: 'R7,200', creditScore: 611 },
        { id: 'demo-3', rank: 3, storeName: 'Alex Value Shop', location: 'Alexandra', cashFlow: 'R5,900', creditScore: 584 },
      ],
    });
  } catch (error) {
    captureServerError(error, { route: '/api/agents' });
    return NextResponse.json({ success: false, error: 'Unable to fetch agents.' }, { status: 500 });
  }
}