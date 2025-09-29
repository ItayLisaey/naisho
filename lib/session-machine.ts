import { assign, createMachine } from "xstate";
import { z } from "zod";
import type { SASResult } from "./sas";
import type { WebRTCConnection } from "./webrtc";

const TextMessageSchema = z.object({
  type: z.union([z.literal("full"), z.literal("patch")]),
  seq: z.number(),
  text: z.string().optional(),
  from: z.number().optional(),
  to: z.number().optional(),
});

const PatchMessageSchema = z.object({
  from: z.number(),
  to: z.number(),
  text: z.string(),
});

export type TextMessage = z.infer<typeof TextMessageSchema>;
export type PatchMessage = z.infer<typeof PatchMessageSchema>;

export interface PeerInfo {
  ip: string;
  city?: string;
  country?: string;
}

export interface SessionContext {
  role: "writer" | "reader";
  offerToken?: string;
  answerToken?: string;
  connection?: WebRTCConnection;
  sas?: SASResult;
  connectionState: RTCPeerConnectionState;
  sasConfirmed: boolean;
  error?: string;
  text: string;
  sequence: number;
  lastReceivedSequence: number;
  isGeneratingOffer: boolean;
  isCreatingAnswer: boolean;
  isAcceptingAnswer: boolean;
  peerInfo?: PeerInfo;
}

export type SessionEvent =
  | { type: "GENERATING_OFFER" }
  | { type: "GENERATED_OFFER"; token: string }
  | { type: "ACCEPTING_ANSWER" }
  | { type: "GOT_ANSWER"; token: string }
  | { type: "PASTED_OFFER"; token: string }
  | { type: "CREATING_ANSWER" }
  | { type: "CREATED_ANSWER"; token: string }
  | { type: "PROCEED_TO_CONNECTION" }
  | { type: "CONNECTING"; connection: WebRTCConnection }
  | { type: "CONNECTED" }
  | { type: "CONNECTION_STATE_CHANGED"; state: RTCPeerConnectionState }
  | { type: "SAS_COMPUTED"; sas: SASResult }
  | { type: "SAS_CONFIRMED" }
  | { type: "PEER_INFO_RECEIVED"; peerInfo: PeerInfo }
  | { type: "TEXT_CHANGED"; text: string }
  | { type: "MESSAGE_RECEIVED"; message: TextMessage }
  | { type: "ERROR"; error: string }
  | { type: "RETRY" };

export const sessionMachine = createMachine({
  id: "session",
  initial: "token",
  types: {
    context: {} as SessionContext,
    events: {} as SessionEvent,
    input: {} as { role: "writer" | "reader" },
  },
  context: ({ input }) => ({
    role: input.role,
    connectionState: "new" as RTCPeerConnectionState,
    sasConfirmed: false,
    text: "",
    sequence: 0,
    lastReceivedSequence: -1,
    isGeneratingOffer: false,
    isCreatingAnswer: false,
    isAcceptingAnswer: false,
  }),
  states: {
    token: {
      on: {
        GENERATING_OFFER: {
          target: "token",
          actions: assign({
            isGeneratingOffer: true,
          }),
        },
        GENERATED_OFFER: {
          target: "token",
          actions: assign({
            offerToken: ({ event }) => event.token,
            isGeneratingOffer: false,
          }),
        },
        ACCEPTING_ANSWER: {
          target: "token",
          actions: assign({
            isAcceptingAnswer: true,
          }),
        },
        GOT_ANSWER: {
          target: "connection",
          actions: assign({
            answerToken: ({ event }) => event.token,
            isGeneratingOffer: false,
            isCreatingAnswer: false,
            isAcceptingAnswer: false,
          }),
        },
        PASTED_OFFER: {
          target: "token",
          actions: assign({
            offerToken: ({ event }) => event.token,
          }),
        },
        CREATING_ANSWER: {
          target: "token",
          actions: assign({
            isCreatingAnswer: true,
          }),
        },
        CREATED_ANSWER: {
          target: "connection",
          actions: assign({
            answerToken: ({ event }) => event.token,
            isCreatingAnswer: false,
          }),
        },
        PROCEED_TO_CONNECTION: {
          target: "connection",
        },
        ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    connection: {
      on: {
        CONNECTING: {
          target: "connection",
          actions: assign({
            connection: ({ event }) => event.connection,
          }),
        },
        CONNECTION_STATE_CHANGED: {
          target: "connection",
          actions: assign({
            connectionState: ({ event }) => event.state,
          }),
        },
        SAS_COMPUTED: {
          target: "connection",
          actions: assign({
            sas: ({ event }) => event.sas,
          }),
        },
        PEER_INFO_RECEIVED: {
          target: "connection",
          actions: assign({
            peerInfo: ({ event }) => event.peerInfo,
          }),
        },
        SAS_CONFIRMED: [
          {
            target: "textarea",
            guard: ({ context }) => context.connectionState === "connected",
            actions: assign({
              sasConfirmed: true,
            }),
          },
          {
            target: "connection",
            actions: assign({
              sasConfirmed: true,
            }),
          },
        ],
        CONNECTED: [
          {
            target: "textarea",
            guard: ({ context }) => context.sasConfirmed,
          },
          {
            target: "connection",
            actions: assign({
              connectionState: "connected",
            }),
          },
        ],
        ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    textarea: {
      on: {
        TEXT_CHANGED: {
          target: "textarea",
          actions: assign({
            text: ({ event }) => event.text,
            sequence: ({ context }) => context.sequence + 1,
          }),
        },
        MESSAGE_RECEIVED: {
          target: "textarea",
          actions: assign(({ context, event }) => {
            const message = event.message;
            if (
              message.type === "full" &&
              message.seq > context.lastReceivedSequence
            ) {
              return {
                text: message.text,
                lastReceivedSequence: message.seq,
              };
            } else if (
              message.type === "patch" &&
              message.seq > context.lastReceivedSequence &&
              typeof message.from === "number" &&
              typeof message.to === "number" &&
              typeof message.text === "string"
            ) {
              const newText = applyPatch(context.text, {
                from: message.from,
                to: message.to,
                text: message.text,
              });
              return {
                text: newText,
                lastReceivedSequence: message.seq,
              };
            }
            return {};
          }),
        },
        CONNECTION_STATE_CHANGED: [
          {
            target: "error",
            guard: ({ event }) =>
              event.state === "failed" ||
              event.state === "disconnected" ||
              event.state === "closed",
            actions: assign({
              error: "Connection lost",
              connectionState: ({ event }) => event.state,
            }),
          },
          {
            target: "textarea",
            actions: assign({
              connectionState: ({ event }) => event.state,
            }),
          },
        ],
        ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "token",
          actions: assign({
            error: undefined,
            offerToken: undefined,
            answerToken: undefined,
            connection: undefined,
            sas: undefined,
            sasConfirmed: false,
            connectionState: "new",
            text: "",
            sequence: 0,
            lastReceivedSequence: -1,
            isGeneratingOffer: false,
            isCreatingAnswer: false,
            isAcceptingAnswer: false,
          }),
        },
      },
    },
  },
});

function applyPatch(text: string, patch: PatchMessage): string {
  return text.slice(0, patch.from) + patch.text + text.slice(patch.to);
}
