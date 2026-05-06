import { NextResponse } from 'next/server'

const GITHUB_OWNER = 'himanshudube97'
const GITHUB_REPO = 'Hearth'

const ASSET_MATCHERS: Record<string, RegExp[]> = {
  'mac-arm': [/aarch64.*\.dmg$/i, /arm64.*\.dmg$/i],
  'mac-intel': [/x64.*\.dmg$/i, /x86_64.*\.dmg$/i],
  windows: [/x64.*-setup\.exe$/i, /\.msi$/i, /\.exe$/i],
  linux: [/\.AppImage$/i, /amd64\.deb$/i, /\.deb$/i],
}

type GitHubAsset = { name: string; browser_download_url: string }
type GitHubRelease = { assets: GitHubAsset[]; tag_name: string }

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const matchers = ASSET_MATCHERS[platform]
  if (!matchers) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
  const res = await fetch(apiUrl, {
    headers: { Accept: 'application/vnd.github+json' },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'No release available yet' },
      { status: 404 }
    )
  }

  const release = (await res.json()) as GitHubRelease
  const asset = release.assets.find((a) =>
    matchers.some((rx) => rx.test(a.name))
  )

  if (!asset) {
    return NextResponse.json(
      { error: `No ${platform} build in release ${release.tag_name}` },
      { status: 404 }
    )
  }

  return NextResponse.redirect(asset.browser_download_url, 302)
}
