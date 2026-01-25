import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/lib/models/Agent';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { phone, name, location } = body;

    if (!phone || !name || !location) {
      return NextResponse.json({
        success: false,
        error: 'Phone, name, and location required',
      }, { status: 400 });
    }

    const agent = await Agent.create({ 
      phone: phone.toString(), 
      name: name.toString(), 
      location: location.toString() 
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
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Phone number already registered',
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Registration failed - try again',
    }, { status: 500 });
  }
}
