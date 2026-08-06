import { psQuote } from './powershell'

/**
 * Shared by apply (write the desired Cloudflare servers) and revert (write back the captured
 * previous servers) — same write, different source values.
 *
 * Windows' Set-DnsClientServerAddress has no -AddressFamily parameter: -ServerAddresses takes one
 * combined list and infers each address's family from its format, and -ResetServerAddresses resets
 * BOTH families at once — there's no way to reset only one family in a single call. So a "mixed"
 * revert target (one family should end up static, the other back on DHCP) needs two calls: reset
 * both to DHCP first, then set only the addresses for whichever family should stay/become static.
 * `ipv6.touch = false` means IPv6 isn't enabled on this adapter — it's left out of every call.
 *
 * No try/catch: -ErrorAction Stop turns a real failure into an uncaught terminating error, which
 * aborts the script before it reaches `exit 0`, so a genuine failure still produces a non-zero
 * exit and gets reported accurately (see the exit-code discovery from the Phase 5/6 crash-safety work).
 */
export function buildDnsWriteScript(
  interfaceIndex: number,
  ipv4Servers: string[] | null,
  ipv6: { touch: boolean; servers: string[] | null }
): string {
  const wantsV4Static = ipv4Servers !== null
  const wantsV6Static = ipv6.touch && ipv6.servers !== null
  const v6InScopeWantsDhcp = ipv6.touch && !wantsV6Static

  const anyWantsStatic = wantsV4Static || wantsV6Static
  const anyWantsDhcp = !wantsV4Static || v6InScopeWantsDhcp

  const allStaticAddresses = [...(wantsV4Static ? ipv4Servers! : []), ...(wantsV6Static ? ipv6.servers! : [])]

  const lines: string[] = []

  if (!anyWantsStatic) {
    lines.push(`Set-DnsClientServerAddress -InterfaceIndex ${interfaceIndex} -ResetServerAddresses -ErrorAction Stop`)
  } else if (!anyWantsDhcp) {
    const list = allStaticAddresses.map((s) => `'${psQuote(s)}'`).join(',')
    lines.push(
      `Set-DnsClientServerAddress -InterfaceIndex ${interfaceIndex} -ServerAddresses ${list} -ErrorAction Stop`
    )
  } else {
    // Mixed: one family goes back to DHCP, the other needs specific static addresses.
    lines.push(`Set-DnsClientServerAddress -InterfaceIndex ${interfaceIndex} -ResetServerAddresses -ErrorAction Stop`)
    const list = allStaticAddresses.map((s) => `'${psQuote(s)}'`).join(',')
    lines.push(
      `Set-DnsClientServerAddress -InterfaceIndex ${interfaceIndex} -ServerAddresses ${list} -ErrorAction Stop`
    )
  }

  lines.push('exit 0')
  return lines.join('\n')
}
