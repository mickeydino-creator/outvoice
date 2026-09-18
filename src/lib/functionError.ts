// supabase-js's default error for a failed Edge Function call
// ("Edge Function returned a non-2xx status code") hides the actual reason.
// When the failure is an HTTP response (FunctionsHttpError), the real message
// is in that response's JSON body. When it's a network-level failure instead
// (e.g. the function doesn't exist, or a connectivity problem), `error.context`
// isn't a Response at all — so this must not assume it has `.clone()`/`.json()`.
export async function extractFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown })?.context
  if (context instanceof Response) {
    try {
      const body = await context.clone().json()
      if (body?.error) return body.error as string
    } catch {
      // response wasn't JSON (or already consumed) — fall through
    }
  }
  return fallback
}
