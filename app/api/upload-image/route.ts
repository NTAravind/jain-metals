// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_OWNER = process.env.GITHUB_OWNER || ''
const GITHUB_REPO = process.env.GITHUB_REPO || ''
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

export async function POST(request: NextRequest) {
  const t0 = Date.now()
  console.log('[upload-image] POST start', { ts: new Date().toISOString() })

  try {
    const body = await request.json()
    const { filename, content, message } = body

    console.log('[upload-image] payload', {
      filename,
      contentLen: typeof content === 'string' ? content.length : null,
      message: message ?? null,
    })

    if (!filename || !content) {
      console.warn('[upload-image] bad request — missing filename or content')
      return NextResponse.json({ error: 'Filename and content are required' }, { status: 400 })
    }

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      console.error('[upload-image] missing GitHub env config', {
        hasToken: Boolean(GITHUB_TOKEN),
        owner: GITHUB_OWNER || null,
        repo: GITHUB_REPO || null,
      })
      return NextResponse.json({ error: 'GitHub upload is not configured' }, { status: 500 })
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/images/${encodeURIComponent(filename)}`
    console.log('[upload-image] → GitHub PUT', { apiUrl, branch: GITHUB_BRANCH })

    const t1 = Date.now()
    const githubResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: message || `Add image: ${filename}`,
        content,
        branch: GITHUB_BRANCH,
      }),
    })
    console.log('[upload-image] ← GitHub response', {
      status: githubResponse.status,
      ok: githubResponse.ok,
      ms: Date.now() - t1,
    })

    if (!githubResponse.ok) {
      const errorBody = await githubResponse.text()
      console.error('[upload-image] GitHub API error', {
        status: githubResponse.status,
        body: errorBody,
      })
      return NextResponse.json({ error: 'Failed to upload to GitHub' }, { status: githubResponse.status })
    }

    const result = await githubResponse.json()
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/images/${filename}`

    console.log('[upload-image] success', {
      sha: result.content?.sha,
      downloadUrl: result.content?.download_url,
      cdnUrl,
      totalMs: Date.now() - t0,
    })

    return NextResponse.json({
      success: true,
      url: result.content.download_url,
      cdnUrl,
      sha: result.content.sha,
    })
  } catch (error) {
    console.error('[upload-image] unhandled error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalMs: Date.now() - t0,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}