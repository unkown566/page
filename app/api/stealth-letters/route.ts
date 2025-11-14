import { NextRequest, NextResponse } from 'next/server';
import {
  getAllLetters,
  getLettersByLanguage,
  getRandomLetter,
  getLoadingQualifier,
  generateStealthPage
} from '@/lib/stealthLetters';

/**
 * GET /api/stealth-letters
 * 
 * Query parameters:
 * - action: 'all' | 'random' | 'language' | 'qualifier' | 'page'
 * - language: 'ja' | 'en' (for language action)
 * - letterId: string (for specific letter)
 * - format: 'json' | 'html' (default: json)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'random';
    const language = (searchParams.get('language') || 'all') as 'ja' | 'en' | 'all';
    const format = searchParams.get('format') || 'json';
    const letterId = searchParams.get('letterId');

    let response;

    switch (action) {
      case 'all':
        response = getAllLetters();
        break;

      case 'language':
        response = getLettersByLanguage(language);
        break;

      case 'random':
        response = getRandomLetter(language === 'all' ? undefined : language as 'ja' | 'en');
        break;

      case 'qualifier':
        response = getLoadingQualifier();
        break;

      case 'page':
        const htmlPage = generateStealthPage(letterId || undefined);
        return new NextResponse(htmlPage, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

      default:
        response = getRandomLetter();
    }

    // Handle single response or array
    const singleResponse = Array.isArray(response) ? response[0] : response;
    
    if (format === 'html' && singleResponse && 'htmlContent' in singleResponse && singleResponse.htmlContent) {
      return new NextResponse(singleResponse.htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    return NextResponse.json({
      success: true,
      action,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stealth letters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stealth-letters
 * Send letter via email or other channels
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, letterId, language } = body;

    let letter;

    if (letterId) {
      const allLetters = getAllLetters();
      letter = allLetters.find(l => l.id === letterId);
      if (!letter) {
        return NextResponse.json(
          { error: 'Letter not found' },
          { status: 404 }
        );
      }
    } else if (language) {
      letter = getRandomLetter(language === 'all' ? undefined : language);
    } else {
      letter = getRandomLetter();
    }

    return NextResponse.json({
      success: true,
      letter: {
        id: letter.id,
        language: letter.language,
        category: letter.category,
        htmlContent: letter.htmlContent,
        plainText: letter.plainText,
        isLoadingQualifier: letter.isLoadingQualifier
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stealth letters POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

