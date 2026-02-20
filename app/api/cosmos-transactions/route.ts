import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to proxy Injective LCD API requests for Cosmos transactions
 * This avoids CORS issues when calling LCD from the browser
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Injective Mainnet LCD endpoint
    // Using the transactions endpoint with pagination
    // Query for both send and receive transactions, and swap transactions
    const apiUrl = `https://sentry.lcd.injective.network:443/cosmos/tx/v1beta1/txs?events=transfer.recipient='${address}'&events=transfer.sender='${address}'&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;
    
    console.log(`[API] Fetching Cosmos transactions from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[API] Cosmos transactions response status: ${response.status}`);

    if (!response.ok) {
      // Check if it's a 404 - might mean no transactions yet
      if (response.status === 404) {
        return NextResponse.json({
          txs: [],
          pagination: null
        });
      }
      
      return NextResponse.json(
        { error: `LCD API returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    
    // Check if response is HTML (error page) instead of JSON
    if (contentType?.includes('text/html')) {
      console.log('[API] Received HTML instead of JSON - probably no transactions');
      return NextResponse.json({
        txs: [],
        pagination: null
      });
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Cosmos transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Cosmos transactions' },
      { status: 500 }
    );
  }
}

