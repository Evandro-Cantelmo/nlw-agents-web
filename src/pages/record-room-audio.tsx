import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

type RoomParams = {
  roomId: string;
};
const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function" &&
  typeof window.MediaRecorder === "function";

export function RecordRoomAudio() {
  const [isRecording, setIsRecording] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const params = useParams<RoomParams>();
  const intervalRef = useRef<NodeJS.Timeout>(null);

  async function uploadAudio(audio: Blob) {
    const formData = new FormData();

    formData.append("file", audio, "audio.webm");
    const response = await fetch(
      `http://localhost:3333/rooms/${params.roomId}/audio`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    console.log(result);
  }

  function stopRecording() {
    setIsRecording(false);

    if (recorder.current && recorder.current.state !== "inactive") {
      recorder.current.stop();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  function createRecorder(audio: MediaStream) {
    recorder.current = new MediaRecorder(audio, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 64_000,
    });
    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        uploadAudio(event.data);
        // biome-ignore lint/suspicious/noConsole: <explanation>
        console.log(event.data);
      }
    };
    recorder.current.onstart = () => {
      console.log("Gravaçao iniciada");
    };
    recorder.current.onstop = () => {
      console.log("gravaçao encerrada");
    };

    recorder.current.start();
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      alert("O seu navegador não suporta gravação");
      return;
    }
    setIsRecording(true);

    const audio = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44_100,
      },
    });
    createRecorder(audio);
    intervalRef.current = setInterval(() => {
      recorder.current?.stop();
      createRecorder(audio);
    }, 5000);
  }

  if (!params.roomId) {
    return <Navigate replace to="/" />;
  }
  return (
    <div className="container mx-auto flex h-screen max-w-4xl flex-col gap-3 px-4 py-8">
      <Link to={`/rooms/${params.roomId}`}>
        <Button variant="outline">
          <ArrowLeft className="mr-2 size-4" />
          Voltar à sala
        </Button>
      </Link>
      <div className="flex h-full flex-col items-center justify-center">
        {isRecording ? (
          <Button onClick={stopRecording}>Parar áudio</Button>
        ) : (
          <Button onClick={startRecording}>Gravar áudio</Button>
        )}
        {isRecording ? <p>Gravando...</p> : <p>Pausado</p>}
      </div>
    </div>
  );
}
