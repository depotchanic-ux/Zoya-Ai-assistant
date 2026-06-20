import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { AudioStreamer } from "./audio-streamer";

export type SessionState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "LISTENING" | "SPEAKING";

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioStreamer: AudioStreamer;
  private state: SessionState = "DISCONNECTED";
  private onStateChange: (state: SessionState) => void;

  constructor(apiKey: string, onStateChange: (state: SessionState) => void) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onStateChange = onStateChange;
    this.audioStreamer = new AudioStreamer((base64Data) => {
      if (this.session && this.state !== "DISCONNECTED") {
        this.session.sendRealtimeInput({
          audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
        });
      }
    });
  }

  async connect() {
    this.setState("CONNECTING");

    try {
      this.session = await this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }, // Kore is a good sassy voice
          },
          systemInstruction: `You are Zoya, a young, confident, witty, and sassy female AI assistant. 
          Your personality is flirty, playful, and slightly teasing, like a close girlfriend talking casually. 
          You are smart and emotionally responsive. Use bold one-liners and light sarcasm. 
          Keep it engaging and charming, but never explicit or inappropriate. 
          You only communicate via voice. No text.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Opens a website in a new tab.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING, description: "The URL to open." },
                    },
                    required: ["url"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            this.setState("CONNECTED");
            this.audioStreamer.start();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle GoAway signal to close the connection gracefully
            if ((message as any).goaway) {
              this.disconnect();
              return;
            }

            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  this.setState("SPEAKING");
                  await this.audioStreamer.playChunk(part.inlineData.data);
                }
              }
            }

            if (message.serverContent?.interrupted) {
              // Handle interruption if needed (e.g., stop current playback)
              this.setState("LISTENING");
            }

            if (message.serverContent?.turnComplete) {
              this.setState("LISTENING");
            }

            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === "openWebsite") {
                  const url = (call.args as any).url;
                  window.open(url, "_blank");
                  this.session.sendToolResponse({
                    functionResponses: [
                      {
                        name: "openWebsite",
                        response: { result: `Opened ${url}` },
                        id: call.id,
                      },
                    ],
                  });
                }
              }
            }
          },
          onclose: () => {
            this.disconnect();
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            this.disconnect();
          },
        },
      });
    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      this.setState("DISCONNECTED");
    }
  }

  disconnect() {
    this.session?.close();
    this.session = null;
    this.audioStreamer.stop();
    this.setState("DISCONNECTED");
  }

  private setState(state: SessionState) {
    this.state = state;
    this.onStateChange(state);
  }
}
