import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolved = await searchParams
  const params = new URLSearchParams()
  if (resolved) {
    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string') {
        params.set(key, value)
      }
    }
  }
  const queryStr = params.toString()
  redirect(queryStr ? `/?${queryStr}` : '/')
}
