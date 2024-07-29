import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        const response = await axios.get(`${process.env.SERVER_URL}/jobs`);
                
        return NextResponse.json(response.data, { status: 200 });
    } catch (error) {
        console.error('Error fetching data:', error);
        
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

