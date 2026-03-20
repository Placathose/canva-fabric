import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button'
import { Upload as UploadIcon } from 'lucide-react'
// Typescript Model Cheatsheet

function Video({canvas, canvasRef}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoSrc, setVideoSrc] = useState<HTMLVideoElement | null>(null)
  const [fabricVideo, setFabricVideo] = useState(null);
  const [recordingChunks, setRecordingChunks] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if(file) {
        setLoadPercentage(0);
        setVideoSrc(null);
        setUploadMessage("");

        const url = URL.createObjectURL(file);
        setVideoSrc(url);

        const videoElement = document.createElement("video");
        videoElement.src = url;
        videoElement.crossOrigin = "anonymous";

        videoElement.addEventListener("loadeddata", () => {
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;
            videoElement.width = videoWidth;
            videoElement.height = videoHeight;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            const scale = Math.min(
                canvasWidth / videoWidth, 
                canvasHeight / videoHeight
            );

            canvas.renderAll();

            const fabricImage = new FabricImage(videoElement, {
                left: 0,
                top: 0,
                scaleX: scale,
                scaleY: scale,
            })  
            
            setFabricVideo(fabricImage);
            canvas.add(fabricImage);
            canvas.renderAll();

            setUploadMessage("Uploaded Successfully");
            setTimeout(() => {
                setUploadMessage("");
            }, 3000);
        });

        videoElement.addEventListener("progress", () => {
            if(videoElement.buffered.length > 0) {
                const bufferedEnd = videoElement.buffered.end(
                    videoElement.buffered.length - 1
                );
                const duration = videoElement.duration;
                if(duration > 0) {
                    setLoadPercentage((bufferedEnd / duration) * 100);   
                }
            }
        })

        videoElement.addEventListener("error", (error) => {
            console.error("Video loading error:", error);
        });

        videoRef.current = videoElement;
    }
  }

  const handlePlayPauseVideo = () => {
    if(videoRef.current) {
        if(videoRef.current.paused) {
            videoRef.current.play();
            videoRef.current.addEventListener("timeupdate", () => {
                fabricVideo.setElement(videoRef.current);
                canvas.renderAll();
            });
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }
  }

  const handleStopVideo = () => {
    if(videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        canvas.renderAll();
    }
  };




  useEffect(() => {
    
  }, [])

  return (
    <>
        <input 
            ref={fileInputRef}
            type="file" 
            style={{ display: 'none' }}
            accept="video/mp4" 
            onChange={handleVideoUpload} 
        />

        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="icon">
            <UploadIcon />
        </Button>
    </>
  );
}

export default Video;