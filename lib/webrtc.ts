import { z } from "zod";

// Only define schemas for data that gets serialized/validated
const OfferResultSchema = z.object({
  sdp: z.string(),
  fingerprint: z.string(),
});

const AnswerResultSchema = z.object({
  sdp: z.string(),
  fingerprint: z.string(),
});

export type OfferResult = z.infer<typeof OfferResultSchema>;
export type AnswerResult = z.infer<typeof AnswerResultSchema>;

// Keep these as regular interfaces since they involve browser APIs
export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface WebRTCConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  onMessage: (callback: (data: string) => void) => void;
  onConnectionStateChange: (
    callback: (state: RTCPeerConnectionState) => void,
  ) => void;
  send: (message: string) => void;
  close: () => void;
}

const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export async function createOffer(): Promise<{
  connection: RTCPeerConnection;
  offer: OfferResult;
  dataChannel: RTCDataChannel;
}> {
  const connection = new RTCPeerConnection(DEFAULT_RTC_CONFIG);

  // Create data channel
  const dataChannel = connection.createDataChannel("txt", { ordered: true });

  // Wait for ICE gathering to complete
  await new Promise<void>((resolve) => {
    connection.onicegatheringstatechange = () => {
      if (connection.iceGatheringState === "complete") {
        resolve();
      }
    };

    // Create and set local description to start ICE gathering
    connection.createOffer().then((offer) => {
      connection.setLocalDescription(offer);
    });
  });

  const localDescription = connection.localDescription;
  if (!localDescription) {
    throw new Error("Failed to create offer");
  }

  const fingerprint = extractFingerprint(localDescription.sdp);
  if (!fingerprint) {
    throw new Error("Failed to extract fingerprint from SDP");
  }

  const offerResult = {
    sdp: localDescription.sdp,
    fingerprint,
  };

  // Validate the offer result with Zod
  const validatedOffer = OfferResultSchema.parse(offerResult);

  return {
    connection,
    offer: validatedOffer,
    dataChannel,
  };
}

export async function createAnswer(
  offerSdp: string,
): Promise<{ connection: RTCPeerConnection; answer: AnswerResult }> {
  const connection = new RTCPeerConnection(DEFAULT_RTC_CONFIG);

  // Set remote description
  await connection.setRemoteDescription({
    type: "offer",
    sdp: offerSdp,
  });

  // Create answer
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);

  // Wait for ICE gathering to complete
  await new Promise<void>((resolve) => {
    connection.onicegatheringstatechange = () => {
      if (connection.iceGatheringState === "complete") {
        resolve();
      }
    };
  });

  const localDescription = connection.localDescription;
  if (!localDescription) {
    throw new Error("Failed to create answer");
  }

  const fingerprint = extractFingerprint(localDescription.sdp);
  if (!fingerprint) {
    throw new Error("Failed to extract fingerprint from SDP");
  }

  const answerResult = {
    sdp: localDescription.sdp,
    fingerprint,
  };

  // Validate the answer result with Zod
  const validatedAnswer = AnswerResultSchema.parse(answerResult);

  return {
    connection,
    answer: validatedAnswer,
  };
}

export async function acceptAnswer(
  connection: RTCPeerConnection,
  answerSdp: string,
): Promise<void> {
  await connection.setRemoteDescription({
    type: "answer",
    sdp: answerSdp,
  });
}

export function createWebRTCConnection(
  connection: RTCPeerConnection,
  dataChannelRef?: RTCDataChannel,
): WebRTCConnection {
  let dataChannel: RTCDataChannel | null = dataChannelRef || null;
  const messageCallbacks: Array<(data: string) => void> = [];
  const stateCallbacks: Array<(state: RTCPeerConnectionState) => void> = [];

  if (!dataChannel) {
    // For the answerer, wait for the data channel
    connection.ondatachannel = (event) => {
      if (event.channel.label === "txt") {
        dataChannel = event.channel;
        setupDataChannel();
      }
    };
  }

  function setupDataChannel() {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      for (const callback of messageCallbacks) {
        callback(event.data);
      }
    };
  }

  // If we already have a data channel (initiator), set it up
  if (dataChannel) {
    setupDataChannel();
  }

  connection.onconnectionstatechange = () => {
    for (const callback of stateCallbacks) {
      callback(connection.connectionState);
    }
  };

  return {
    connection,
    dataChannel,
    onMessage: (callback) => {
      messageCallbacks.push(callback);
    },
    onConnectionStateChange: (callback) => {
      stateCallbacks.push(callback);
    },
    send: (message) => {
      if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(message);
      } else {
        console.warn("Data channel not ready for sending");
      }
    },
    close: () => {
      if (dataChannel) {
        dataChannel.close();
      }
      connection.close();
    },
  };
}

function extractFingerprint(sdp: string): string | null {
  const fingerprintLine = sdp
    .split("\n")
    .find((line) => line.startsWith("a=fingerprint:"));
  if (!fingerprintLine) return null;

  // Extract the hash part after "sha-256 "
  const match = fingerprintLine.match(/a=fingerprint:sha-256\s+(.+)/);
  return match ? match[1].trim() : null;
}
