import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch the FantasyPros login page to debug CSRF token extraction
    const loginUrl = 'https://secure.fantasypros.com/accounts/login/';
    
    const response = await fetch(loginUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `Failed to fetch login page: ${response.status}`,
        status: response.status
      });
    }

    const html = await response.text();
    const cookies = response.headers.get('set-cookie');

    // Try different CSRF patterns
    const csrfPatterns = [
      { name: 'Pattern 1', regex: /name=['"]csrfmiddlewaretoken['"][^>]*value=['"]([^'"]+)['"]/ },
      { name: 'Pattern 2', regex: /name='csrfmiddlewaretoken'\s+value='([^']+)'/ },
      { name: 'Pattern 3', regex: /name="csrfmiddlewaretoken"\s+value="([^"]+)"/ },
      { name: 'Pattern 4', regex: /value=['"]([^'"]+)['"][^>]*name=['"]csrfmiddlewaretoken['"]/ },
      { name: 'Pattern 5', regex: /<input[^>]*csrfmiddlewaretoken[^>]*value=['"]([^'"]+)['"]/ },
      { name: 'Pattern 6', regex: /csrfmiddlewaretoken['"]\s*:\s*['"]([^'"]+)['"]/ }
    ];

    const results = csrfPatterns.map(pattern => {
      const match = html.match(pattern.regex);
      return {
        pattern: pattern.name,
        found: !!match,
        token: match ? match[1].substring(0, 20) + '...' : null
      };
    });

    // Look for all input fields
    const inputMatches = Array.from(html.matchAll(/<input[^>]+>/g));
    const inputs = inputMatches.map(match => match[0]);

    // Look for forms
    const formRegex = new RegExp('<form[^>]*>(.*?)</form>', 'gs');
    const formMatches = Array.from(html.matchAll(formRegex));
    const forms = formMatches.map(match => match[0].substring(0, 200) + '...');

    return NextResponse.json({
      success: true,
      loginPageLength: html.length,
      hasCookies: !!cookies,
      csrfPatternResults: results,
      inputFields: inputs.filter(input => input.includes('csrf') || input.includes('token')),
      forms: forms,
      htmlPreview: html.substring(0, 2000) + '...',
      // Search for any token-like patterns
      tokenLikeStrings: Array.from(html.matchAll(/token['"]?\s*[:=]\s*['"]?([a-zA-Z0-9_-]{20,})/g))
        .map(match => ({ context: match[0], token: match[1].substring(0, 20) + '...' }))
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}