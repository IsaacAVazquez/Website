import { NextRequest, NextResponse } from 'next/server';

interface SubscriptionRequest {
  email: string;
  interests?: string[];
  source?: string;
  name?: string;
}

// Mock subscription data storage (in production, this would connect to a service like Mailchimp, ConvertKit, etc.)
const subscribers = new Map<string, {
  email: string;
  interests: string[];
  source: string;
  subscribedAt: string;
  confirmed: boolean;
}>();

export async function POST(request: NextRequest) {
  try {
    const body: SubscriptionRequest = await request.json();
    const { email, interests = [], source = 'website' } = body;

    // Validate email
    if (!email || !email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    if (subscribers.has(email.toLowerCase())) {
      return NextResponse.json(
        { message: 'You are already subscribed to our newsletter!' },
        { status: 409 }
      );
    }

    // In production, this would:
    // 1. Connect to your email service provider (Mailchimp, ConvertKit, etc.)
    // 2. Add the subscriber to your list
    // 3. Send a confirmation email
    // 4. Handle double opt-in if required
    
    // Mock implementation for demo purposes
    const subscription = {
      email: email.toLowerCase(),
      interests: interests.filter(Boolean),
      source,
      subscribedAt: new Date().toISOString(),
      confirmed: false // Would be true after email confirmation
    };

    subscribers.set(email.toLowerCase(), subscription);

    // Log the subscription (in production, you might want to track this in analytics)
    console.log('New newsletter subscription:', {
      email: email.toLowerCase(),
      interests,
      source,
      timestamp: new Date().toISOString()
    });

    // In production, you would:
    // 1. Add to your email service provider
    // 2. Send welcome/confirmation email
    // 3. Track the conversion event
    
    return NextResponse.json({
      message: 'Successfully subscribed! Please check your email for confirmation.',
      success: true,
      subscription: {
        email: email.toLowerCase(),
        interests,
        subscribedAt: subscription.subscribedAt
      }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET endpoint to check subscription status (optional)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { message: 'Email parameter is required' },
      { status: 400 }
    );
  }

  const subscription = subscribers.get(email.toLowerCase());
  
  return NextResponse.json({
    subscribed: !!subscription,
    confirmed: subscription?.confirmed || false,
    subscribedAt: subscription?.subscribedAt || null
  });
}

// In production, you might also want:
// 1. DELETE endpoint for unsubscribing
// 2. PUT endpoint for updating preferences
// 3. Proper database storage instead of in-memory Map
// 4. Rate limiting to prevent abuse
// 5. Email validation service integration
// 6. GDPR compliance features