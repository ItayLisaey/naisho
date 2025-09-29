# naisho

Secure peer-to-peer secret sharing in the browser. No server storage, no middlemen.

**Live at [naisho.channel](https://naisho.channel)**

## Features

- **End-to-end encrypted** — WebRTC with DTLS encryption
- **Zero server storage** — Everything stays in your browser
- **SAS verification** — Authenticate connections with human-readable words
- **Diceword tokens** — Share connection info using memorable phrases
- **Live collaboration** — Real-time text editing over secure data channels

## Quick Start

```bash
pnpm install
pnpm dev
```

## How It Works

1. One person generates a token
2. Share the token (dicewords or raw)
3. Both verify the connection with SAS words
4. Share secrets in real-time

No registration. No tracking. No server storage.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.