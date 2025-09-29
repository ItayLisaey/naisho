# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev` (uses Turbopack)
- **Build**: `pnpm build` (uses Turbopack)
- **Production server**: `pnpm start`
- **Testing**: `pnpm test` (Vitest), `pnpm test:ui`, `pnpm test:coverage`
- **Type check**: `pnpm typecheck` (uses TypeScript)
- **Lint**: `pnpm lint` (uses Biome)
- **Format**: `pnpm format` (uses Biome with auto-write)

!important: Always pnpm typecheck and lint after making major changes.
!important: Run tests before deploying with `pnpm test:run`.

- Try very hard not to use `any` type in the code.

## Architecture Overview

This is a Next.js 15 application for secure peer-to-peer secret sharing using WebRTC.

### Key Technologies

- **Framework**: Next.js 15 with Turbopack
- **State Management**: XState v5 for session wizard flow
- **UI**: Radix UI primitives + shadcn/ui components (New York style)
- **Styling**: Tailwind CSS v4 with CSS variables
- **WebRTC**: Custom implementation with DTLS encryption
- **Security**: SAS verification + Zod validation
- **Compression**: pako for token compression
- **Query State**: nuqs for URL state synchronization
- **Icons**: Lucide React
- **Linting/Formatting**: Biome (not ESLint/Prettier)

### Project Structure

- `app/`: Next.js App Router pages and layouts
  - `page.tsx`: Redirects to `/session`
  - `session/page.tsx`: Role selection + session wizard
  - `whitepaper/page.tsx`: Security documentation
  - `layout.tsx`: Global layout with footer
- `components/`: Session wizard components
  - `ui/`: shadcn/ui components
  - `session-card.tsx`: Main wizard controller (XState)
  - `token-step.tsx`: Diceword token interface
  - `connection-step.tsx`: SAS verification step
  - `textarea-step.tsx`: Live text editor
  - `footer.tsx`: Global footer with links
- `lib/`: Core functionality
  - `session-machine.ts`: XState wizard state machine
  - `webrtc.ts`: WebRTC offer/answer/data channels
  - `token.ts`: Token compression + diceword display
  - `sas.ts`: Short Authentication String computation
  - `dicewords.ts`: Human-readable token display
  - `utils.ts`: Tailwind utility functions
- `public/`: Static assets
  - `dicewords.txt`: 7776-word dictionary for token display

### Component System

- Uses shadcn/ui with "New York" style variant
- Path aliases: `@/` maps to root directory
- Components follow Radix UI + class-variance-authority pattern
- XState machine drives the session wizard flow
- Responsive design (mobile-first approach)

### Development Notes

- TypeScript strict mode enabled
- Uses pnpm as package manager
- Biome handles both linting and formatting
- WebRTC connections use STUN servers for NAT traversal
- All secret data stays in-browser (no server storage)
- Try to pnpm typecheck and lint and format after making major changes.

# Important Patterns

## WebRTC Session Pattern

This app follows a simple client-side session pattern with XState for state management:

### 1. Session Wizard Flow
- **Token Step**: Generate/paste tokens, convert to dicewords for display
- **Connection Step**: WebRTC connection + SAS verification
- **Textarea Step**: Live collaborative text editing

### 2. State Management (XState)
- Single machine in `session-machine.ts` drives the entire wizard
- Events: `GENERATED_OFFER`, `GOT_ANSWER`, `CONNECTED`, `SAS_CONFIRMED`, etc.
- Context holds: tokens, connection state, SAS, text content
- Guards ensure proper flow (SAS + connection both required for textarea)

### 3. Token System Architecture
```
Token Generation:
JSON → pako.deflate() → base64url → stored/transmitted

Display Generation:
base64url → SHA-256 → select 8 dicewords → display

UX Flow:
User sees: "apple banana cherry dog..."
Copy button copies: "eyJ2IjoxLCJyb2xlIjoid3JpdGVy..."
Paste auto-detects format and converts for display
```

### 4. WebRTC Connection Pattern
```typescript
// Offer side (writer)
const { connection, offer, dataChannel } = await createOffer();
const token = createOfferToken(offer.sdp, offer.fingerprint);

// Answer side (reader)
const { connection, answer } = await createAnswer(offerToken.sdpOffer);
const answerToken = await createAnswerToken(answer.sdp, answer.fingerprint, offerTokenPacked);

// Both sides
const webrtcConnection = createWebRTCConnection(connection, dataChannel);
webrtcConnection.onMessage((data) => { /* handle text sync */ });
```

### 5. Security Validation
- **Zod schemas** for all token validation
- **SAS computation** from DTLS fingerprints (mandatory verification, now 6 words)
- **Token expiration** checking (3-minute TTL with detailed error messages)
- **Diceword validation** against dictionary
- **CSP headers** for extreme security (XSS, injection, data exfiltration protection)

# Development Reminders

## Key Patterns
- **No server-side state**: Everything happens in the browser
- **XState for complex flows**: Use the existing session machine pattern
- **Dicewords for UX**: Always show human-readable tokens to users
- **Security first**: Never skip SAS verification or token validation
- **Responsive design**: Mobile-first approach with Tailwind

## Common Tasks
- **Adding new wizard steps**: Update `session-machine.ts` and create step component
- **Token changes**: Update both functional format (Zod schemas) and display logic
- **WebRTC debugging**: Check browser dev tools for ICE connection states
- **SAS issues**: Verify DTLS fingerprint extraction from SDP
- **Testing**: Add/update tests in `__tests__/` directory for any new functionality
- **Security headers**: Modify `next.config.ts` for CSP changes (be careful with WebRTC needs)

# Important Instructions
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
