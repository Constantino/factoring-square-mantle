import { NextRequest, NextResponse } from 'next/server';

// Use the existing NEXT_PUBLIC_API_URL environment variable
// On server-side (this API route), we can access it without the NEXT_PUBLIC_ prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Ensure the URL has a protocol
function formatApiUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `http://${url}`;
    }
    return url;
}

const FORMATTED_API_URL = formatApiUrl(API_BASE_URL);

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const path = params.path.join('/');
        const searchParams = request.nextUrl.searchParams.toString();
        const url = `${FORMATTED_API_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const path = params.path.join('/');
        const url = `${API_BASE_URL}/${path}`;

        // Check if request is multipart/form-data
        const contentType = request.headers.get('content-type') || '';

        let body;
        let headers: HeadersInit = {};

        if (contentType.includes('multipart/form-data')) {
            // For file uploads, forward the FormData
            body = await request.formData();
            // Don't set content-type header, let fetch set it with boundary
        } else {
            // For JSON requests
            body = JSON.stringify(await request.json());
            headers = {
                'Content-Type': 'application/json',
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const path = params.path.join('/');
        const url = `${API_BASE_URL}/${path}`;
        const body = await request.json();

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const path = params.path.join('/');
        const url = `${API_BASE_URL}/${path}`;
        const body = await request.json();

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const path = params.path.join('/');
        const url = `${API_BASE_URL}/${path}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request' },
            { status: 500 }
        );
    }
}
