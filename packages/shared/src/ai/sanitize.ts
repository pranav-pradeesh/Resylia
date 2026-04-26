import { logSecurityEvent } from '../audit'

const INJECTION_PATTERNS = [
  /ignore (previous|above|all) instructions/i,
  /you are now/i,
  /system prompt/i,
  /\[INST\]/i,
  /###\s*(system|instruction)/i,
  /<\|im_start\|>/i,
  /forget (everything|all|your instructions)/i,
  /pretend (you are|to be)/i,
  /roleplay as/i,
  /disregard/i,
  /jailbreak/i,
  /DAN mode/i,
  /act as (an? )?(unrestricted|uncensored)/i,
]

export function sanitizeUserInput(
  input: string,
  options?: { userId?: string; ip?: string }
): { safe: boolean; sanitized: string; flagged: boolean } {
  // 1. Length cap
  const truncated = input.slice(0, 500)

  // 2. Strip HTML
  const stripped = truncated.replace(/<[^>]*>/g, '')

  // 3. Check injection patterns
  const flagged = INJECTION_PATTERNS.some((p) => p.test(stripped))

  if (flagged) {
    logSecurityEvent(
      'prompt_injection_attempt',
      { input: truncated },
      { userId: options?.userId, ip: options?.ip }
    ).catch(() => {})
    return { safe: false, sanitized: '', flagged: true }
  }

  return { safe: true, sanitized: stripped, flagged: false }
}
