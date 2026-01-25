import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/lib/models/Agent';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { phone, name, location } = body;

    if (!phone?.toString().startsWith('08') || !name || !location) {
      return NextResponse.json({
        success: false,
        error: 'Valid SA phone (08...), name, and location required',
      }, { status: 400 });
    }

    const agent = await Agent.create({ 
      phone: phone.toString(), 
      name: name.toString().trim(), 
      location: location.toString().trim() 
    });

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agent._id.toString(),
        phone: agent.phone,
        name: agent.name,
        location: agent.location,
        level: agent.level,
        balance: `R${agent.balance.toFixed(2)}`,
        status: 'active',
        registered: agent.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Phone already registered',
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Registration failed',
    }, { status: 500 });
  }
}
