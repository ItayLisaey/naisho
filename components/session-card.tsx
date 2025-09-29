"use client";

import { useMachine } from "@xstate/react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { computeSAS } from "@/lib/sas";
import { sessionMachine } from "@/lib/session-machine";
import {
  createAnswerToken,
  createOfferToken,
  getTokenExpirationError,
  packToken,
  unpackToken,
} from "@/lib/token";
import {
  acceptAnswer,
  createAnswer,
  createOffer,
  createWebRTCConnection,
} from "@/lib/webrtc";
import { ConnectionStep } from "./connection-step";
import { TextareaStep } from "./textarea-step";
import { TokenStep } from "./token-step";

interface SessionCardProps {
  role: "writer" | "reader";
}

interface ExtendedRTCPeerConnection extends RTCPeerConnection {
  dataChannelRef?: RTCDataChannel;
}

export function SessionCard({ role }: SessionCardProps) {
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringEnum(["token", "connection", "textarea"]).withDefault("token"),
  );

  const [state, send] = useMachine(sessionMachine, {
    input: { role },
  });

  const connectionRef = useRef<ExtendedRTCPeerConnection | null>(null);
  const webrtcConnectionRef = useRef<ReturnType<
    typeof createWebRTCConnection
  > | null>(null);
  const textSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync URL step with state machine
  useEffect(() => {
    const currentState = state.value as string;
    if (currentState !== step) {
      setStep(currentState as "token" | "connection" | "textarea");
    }
  }, [state.value, step, setStep]);

  // Handle offer generation (writer)
  const handleGenerateOffer = async () => {
    try {
      send({ type: "GENERATING_OFFER" });

      const { connection, offer, dataChannel } = await createOffer();
      connectionRef.current = connection;

      const token = createOfferToken(offer.sdp, offer.fingerprint);
      const packedToken = packToken(token);

      send({ type: "GENERATED_OFFER", token: packedToken });

      // Store the data channel for later use
      if (connectionRef.current) {
        connectionRef.current.dataChannelRef = dataChannel;
      }
    } catch (error) {
      send({
        type: "ERROR",
        error:
          error instanceof Error ? error.message : "Failed to generate offer",
      });
    }
  };

  // Handle answer creation (reader)
  const handleCreateAnswer = async (offerTokenPacked: string) => {
    try {
      const offerToken = unpackToken(offerTokenPacked);

      if (offerToken.role !== "writer") {
        throw new Error("Expected writer token (invite), got reader token");
      }

      const expirationError = getTokenExpirationError(offerToken);
      if (expirationError) {
        throw new Error(expirationError);
      }

      send({ type: "PASTED_OFFER", token: offerTokenPacked });
      send({ type: "CREATING_ANSWER" });

      const { connection, answer } = await createAnswer(offerToken.sdpOffer);
      connectionRef.current = connection;

      const answerToken = await createAnswerToken(
        answer.sdp,
        answer.fingerprint,
        offerTokenPacked,
      );
      const packedAnswerToken = packToken(answerToken);

      send({ type: "CREATED_ANSWER", token: packedAnswerToken });

      // Set up WebRTC connection
      const webrtcConnection = createWebRTCConnection(connection);
      webrtcConnectionRef.current = webrtcConnection;

      send({ type: "CONNECTING", connection: webrtcConnection });

      // Set up connection state monitoring
      webrtcConnection.onConnectionStateChange((connectionState) => {
        send({ type: "CONNECTION_STATE_CHANGED", state: connectionState });

        if (connectionState === "connected") {
          send({ type: "CONNECTED" });
        }
      });

      // Set up message handling
      webrtcConnection.onMessage((data) => {
        console.log("Reader received message:", data);
        try {
          const message = JSON.parse(data);
          console.log("Parsed message:", message);
          send({ type: "MESSAGE_RECEIVED", message });
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      });

      // Compute SAS
      const sas = await computeSAS(offerToken.fp, answer.fingerprint);
      send({ type: "SAS_COMPUTED", sas });
    } catch (error) {
      send({
        type: "ERROR",
        error:
          error instanceof Error ? error.message : "Failed to create answer",
      });
    }
  };

  // Handle answer acceptance (writer)
  const handleAcceptAnswer = async (answerTokenPacked: string) => {
    try {
      send({ type: "ACCEPTING_ANSWER" });

      const answerToken = unpackToken(answerTokenPacked);

      if (answerToken.role !== "reader") {
        throw new Error("Expected reader token, got writer token");
      }

      if (!connectionRef.current) {
        throw new Error("No active connection");
      }

      await acceptAnswer(connectionRef.current, answerToken.sdpAnswer);

      // Set up WebRTC connection with the stored data channel
      const dataChannel = connectionRef.current?.dataChannelRef;
      const webrtcConnection = createWebRTCConnection(
        connectionRef.current,
        dataChannel,
      );
      webrtcConnectionRef.current = webrtcConnection;

      // Writer should transition to connection state
      send({ type: "GOT_ANSWER", token: answerTokenPacked });
      send({ type: "CONNECTING", connection: webrtcConnection });

      // Set up connection state monitoring
      webrtcConnection.onConnectionStateChange((connectionState) => {
        send({ type: "CONNECTION_STATE_CHANGED", state: connectionState });

        if (connectionState === "connected") {
          send({ type: "CONNECTED" });
        }
      });

      // Set up message handling
      webrtcConnection.onMessage((data) => {
        console.log("Writer received message:", data);
        try {
          const message = JSON.parse(data);
          console.log("Parsed message:", message);
          send({ type: "MESSAGE_RECEIVED", message });
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      });

      // Compute SAS
      const offerToken = unpackToken(state.context.offerToken ?? "");
      const sas = await computeSAS(offerToken.fp, answerToken.fp);
      send({ type: "SAS_COMPUTED", sas });
    } catch (error) {
      send({
        type: "ERROR",
        error:
          error instanceof Error ? error.message : "Failed to accept answer",
      });
    }
  };

  // Handle SAS confirmation
  const handleSasConfirmed = () => {
    send({ type: "SAS_CONFIRMED" });
  };

  // Auto-setup connection for reader when answer is created
  useEffect(() => {
    if (
      role === "reader" &&
      state.context.answerToken &&
      webrtcConnectionRef.current &&
      state.matches("connection")
    ) {
      send({ type: "CONNECTING", connection: webrtcConnectionRef.current });
    }
  }, [role, state.context.answerToken, state.matches, send]);

  // Handle text changes (writer only)
  const handleTextChange = (text: string) => {
    if (role === "writer") {
      send({ type: "TEXT_CHANGED", text });

      // Debounced text sync
      if (textSyncIntervalRef.current) {
        clearTimeout(textSyncIntervalRef.current);
      }

      textSyncIntervalRef.current = setTimeout(() => {
        if (
          webrtcConnectionRef.current &&
          state.context.connectionState === "connected"
        ) {
          const message = {
            type: "full",
            seq: state.context.sequence,
            text,
          };
          console.log("Writer sending message:", message);
          webrtcConnectionRef.current.send(JSON.stringify(message));
        } else {
          console.log(
            "Not sending message - connection state:",
            state.context.connectionState,
            "connection exists:",
            !!webrtcConnectionRef.current,
          );
        }
      }, 200);
    }
  };

  // Handle retry
  const handleRetry = () => {
    if (webrtcConnectionRef.current) {
      webrtcConnectionRef.current.close();
      webrtcConnectionRef.current = null;
    }
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (textSyncIntervalRef.current) {
      clearTimeout(textSyncIntervalRef.current);
      textSyncIntervalRef.current = null;
    }
    setStep("token");
    send({ type: "RETRY" });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (textSyncIntervalRef.current) {
        clearTimeout(textSyncIntervalRef.current);
      }
      if (webrtcConnectionRef.current) {
        webrtcConnectionRef.current.close();
      }
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div>
        <div>
          {state.matches("error") && (
            <Alert className=" flex items-center" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{state.context.error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-4"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {state.matches("token") && (
            <TokenStep
              role={role}
              offerToken={state.context.offerToken}
              answerToken={state.context.answerToken}
              onGenerateOffer={handleGenerateOffer}
              onPasteAnswer={handleAcceptAnswer}
              onCreateAnswer={handleCreateAnswer}
              isGeneratingOffer={state.context.isGeneratingOffer}
              isCreatingAnswer={state.context.isCreatingAnswer}
              isAcceptingAnswer={state.context.isAcceptingAnswer}
            />
          )}

          {state.matches("connection") && (
            <ConnectionStep
              connectionState={state.context.connectionState}
              sas={state.context.sas}
              sasConfirmed={state.context.sasConfirmed}
              onSasConfirmed={handleSasConfirmed}
              onRestart={handleRetry}
              role={role}
              answerToken={state.context.answerToken}
              connection={state.context.connection}
            />
          )}

          {state.matches("textarea") && (
            <TextareaStep
              role={role}
              text={state.context.text}
              onTextChange={handleTextChange}
              connection={state.context.connection}
              connectionState={state.context.connectionState}
            />
          )}
        </div>
      </div>
    </div>
  );
}
