import { createServer, type Server } from 'node:http'
import { randomBytes } from 'node:crypto'
import { shell } from 'electron'

// Google sign-in without a client secret: the system browser opens flowtweaks.com/app-login, which
// shows Google's own sign-in button and then sends the browser to http://127.0.0.1:<port>/callback
// on this machine with the Google ID token. We only ever listen on loopback, only for one request,
// and only accept it if it carries the random `state` we generated for this attempt.
const LOGIN_PAGE = 'https://flowtweaks.com/app-login'
const TIMEOUT_MS = 3 * 60 * 1000

const DONE_PAGE = `<!doctype html><meta charset="utf-8"><title>Flow Tweaks</title>
<body style="background:#0d0d0d;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding-top:20vh">
<h2 style="color:#FF5500">Signed in</h2><p>You can close this tab and return to Flow Tweaks.</p>
<script>history.replaceState(null,'','/done')</script></body>`

let active: Server | null = null

/** Resolves with a Google ID token, or rejects if the user closes the flow / it times out. */
export function getGoogleIdToken(): Promise<string> {
  active?.close()
  const state = randomBytes(24).toString('base64url')

  return new Promise<string>((resolve, reject) => {
    let finished = false
    const finish = (fn: () => void): void => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      server.close()
      if (active === server) active = null
      fn()
    }

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== '/callback') {
        res.writeHead(404).end()
        return
      }
      const idToken = url.searchParams.get('id_token')
      if (url.searchParams.get('state') !== state || !idToken) {
        res.writeHead(400).end('Invalid sign-in response.')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(DONE_PAGE)
      finish(() => resolve(idToken))
    })
    active = server

    const timer = setTimeout(
      () => finish(() => reject(new Error('Google sign-in timed out. Please try again.'))),
      TIMEOUT_MS
    )

    server.on('error', (err) => finish(() => reject(err)))
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        finish(() => reject(new Error('Could not start Google sign-in.')))
        return
      }
      const url = `${LOGIN_PAGE}?port=${addr.port}&state=${encodeURIComponent(state)}`
      shell.openExternal(url).catch((err) => finish(() => reject(err)))
    })
  })
}
