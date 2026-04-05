import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload as UploadIcon,
  Play,
  Pause,
  SquareStop,
  CircleDot,
  Square,
  Download,
} from "lucide-react";
import { FabricImage, FabricObject, type Canvas } from "fabric";

// Typescript Model Cheatsheet

type VideoProps = {
  canvas: Canvas | null;
};

type InteractionSnapshot = {
  selection: boolean;
  objects: Array<{
    obj: FabricObject;
    selectable: boolean;
    evented: boolean;
  }>;
};

// Step 5: Pick the first WebM codec string the browser’s MediaRecorder actually supports.
function pickRecordingMimeType(): string | undefined {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

function Video({ canvas }: VideoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** Keeps the Fabric image in sync for play/pause (state would be “one click behind” here). */
  const fabricVideoRef = useRef<FabricImage | null>(null);
  /** Same function reference for addEventListener and removeEventListener. */
  const timeUpdateHandlerRef = useRef<(() => void) | null>(null);
  /** So we can revoke the old blob URL when you upload again or leave the page. */
  const objectUrlRef = useRef<string | null>(null);

  // You can store any JavaScript value in the .current property. It acts as a "box" for values you want to keep around without triggering a re-render when they change.

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordedMimeTypeRef = useRef("video/webm");
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interactionSnapshotRef = useRef<InteractionSnapshot | null>(null);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);

  // Step 4: Remove the timeupdate listener so playback no longer repaints the Fabric image every frame.
  const removeTimeUpdateListener = () => {
    const video = videoRef.current;
    const handler = timeUpdateHandlerRef.current;
    if (video && handler) {
      video.removeEventListener("timeupdate", handler);
      timeUpdateHandlerRef.current = null;
    }
  };

  // Step 6: Snapshot then turn off selection and object dragging before we start recording the canvas.
  const disableCanvasInteraction = () => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    interactionSnapshotRef.current = {
      selection: canvas.selection,
      objects: objects.map((obj) => ({
        obj,
        selectable: obj.selectable,
        evented: obj.evented,
      })),
    };
    canvas.selection = false;
    canvas.discardActiveObject();
    objects.forEach((obj) => {
      obj.set({ selectable: false, evented: false });
    });
    canvas.renderAll();
  };

  // Step 7: Restore selection and per-object interaction from the snapshot after recording ends.
  const restoreCanvasInteraction = () => {
    if (!canvas) return;
    const snapshot = interactionSnapshotRef.current;
    if (!snapshot) return;
    canvas.selection = snapshot.selection;
    snapshot.objects.forEach(({ obj, selectable, evented }) => {
      obj.set({ selectable, evented });
    });
    interactionSnapshotRef.current = null;
    canvas.renderAll();
  };

  // Step 8: Capture the canvas as a stream, record chunks with MediaRecorder, lock the UI, and start the timer.
  const handleStartRecording = () => {
    if (!canvas || isRecording) return;

    const mimeType = pickRecordingMimeType();
    if (!mimeType) {
      console.error("No supported video/webm type for MediaRecorder");
      return;
    }

    const canvasEl = canvas.getElement();
    let stream: MediaStream;
    try {
      stream = canvasEl.captureStream(30);
    } catch (e) {
      console.error("captureStream failed:", e);
      return;
    }

    recordingChunksRef.current = [];
    setHasRecording(false);

    const recorder = new MediaRecorder(stream, { mimeType });
    recordedMimeTypeRef.current = recorder.mimeType || mimeType;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordingChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      restoreCanvasInteraction();
      setIsRecording(false);
      mediaRecorderRef.current = null;
      if (recordingChunksRef.current.length > 0) {
        setHasRecording(true);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };

    mediaRecorderRef.current = recorder;
    disableCanvasInteraction();
    setRecordingTime(0);
    setIsRecording(true);

    recorder.start(250);

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  // Step 9: Stop MediaRecorder so chunks finalize and the onstop handler cleans up.
  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.stop();
  };

  // Step 10: Merge recorded chunks into one WebM blob and trigger a browser download.
  const handleExportRecording = () => {
    const chunks = recordingChunksRef.current;
    if (chunks.length === 0) return;

    const type = recordedMimeTypeRef.current || "video/webm";
    const blob = new Blob(chunks, { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `canvas-recording-${Date.now()}.webm`;
    anchor.click();
    URL.revokeObjectURL(url);
    recordingChunksRef.current = [];
    setHasRecording(false);
  };

  // Step 1: Read the picked file, build a blob URL and video element, then add it to Fabric as a scaled FabricImage.
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !canvas) {
      return;
    }

    // Drop the previous video from the canvas and free its blob URL
    if (fabricVideoRef.current) {
      canvas.remove(fabricVideoRef.current);
      fabricVideoRef.current = null;
    }
    removeTimeUpdateListener();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setVideoSrc(null);
    setIsPlaying(false);

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setVideoSrc(url);

    const videoElement = document.createElement("video");
    videoElement.src = url;
    videoElement.crossOrigin = "anonymous";

    videoElement.addEventListener("ended", () => {
      setIsPlaying(false);
      removeTimeUpdateListener();
    });

    videoElement.addEventListener("loadeddata", () => {
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      videoElement.width = videoWidth;
      videoElement.height = videoHeight;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const scale = Math.min(
        canvasWidth / videoWidth,
        canvasHeight / videoHeight,
      );

      const fabricImage = new FabricImage(videoElement, {
        left: 0,
        top: 0,
        scaleX: scale,
        scaleY: scale,
      });

      fabricVideoRef.current = fabricImage;
      canvas.add(fabricImage);
      canvas.renderAll();
    });

    videoElement.addEventListener("error", () => {
      console.error("Video loading error");
    });

    videoRef.current = videoElement;
  };

  // Step 2: Play or pause the hidden video and, while playing, refresh the Fabric image on each timeupdate.
  const handlePlayPauseVideo = () => {
    const video = videoRef.current;
    const fabricImg = fabricVideoRef.current;

    if (!video || !canvas || !fabricImg) {
      return;
    }

    if (video.paused) {
      const onTimeUpdate = () => {
        fabricVideoRef.current?.setElement(video);
        canvas.renderAll();
      };
      timeUpdateHandlerRef.current = onTimeUpdate;
      video.addEventListener("timeupdate", onTimeUpdate);

      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Play failed:", err);
          removeTimeUpdateListener();
        });
    } else {
      video.pause();
      setIsPlaying(false);
      removeTimeUpdateListener();
    }
  };

  // Step 3: Pause playback, jump to time 0, update the Fabric image once, and remove the timeupdate listener.
  const handleStopVideo = () => {
    const video = videoRef.current;
    if (!video || !canvas) {
      return;
    }
    removeTimeUpdateListener();
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    fabricVideoRef.current?.setElement(video);
    canvas.renderAll();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept="video/*,.mp4,.webm,.mov,.ogg,.mkv"
        onChange={handleVideoUpload}
      />

      <div className="flex flex-wrap items-center gap-1">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          aria-label="Upload video"
          disabled={isRecording}
        >
          <UploadIcon />
        </Button>

        {!isRecording && (
          <Button
            onClick={handleStartRecording}
            variant="outline"
            size="icon"
            aria-label="Start recording canvas"
            title="Record canvas"
          >
            <CircleDot />
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={handleStopRecording}
            variant="outline"
            size="icon"
            aria-label="Stop recording"
            title="Stop recording"
          >
            <Square />
          </Button>
        )}

        {hasRecording && !isRecording && (
          <Button
            onClick={handleExportRecording}
            variant="outline"
            size="icon"
            aria-label="Download recording"
            title="Download recording"
          >
            <Download />
          </Button>
        )}

        {isRecording && (
          <span className="text-xs tabular-nums text-muted-foreground px-1">
            {recordingTime}s
          </span>
        )}
      </div>

      {videoSrc && (
        <div className="bottom transform darkmode">
          <div className="Toolbar">
            <Button
              onClick={handlePlayPauseVideo}
              variant="ghost"
              size="default"
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button onClick={handleStopVideo} variant="ghost" size="icon">
              <SquareStop />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default Video;
