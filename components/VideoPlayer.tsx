import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  initialTime?: number;
  onTimeUpdate?: (time: number, duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, autoPlay = false, initialTime = 0, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 0) {
            video.currentTime = initialTime;
        }
        if (autoPlay) {
            video.play().catch(e => console.log("Autoplay blocked", e));
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
         if (data.fatal) {
            switch (data.type) {
               case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
               case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
               default:
                  hls.destroy();
                  break;
            }
         }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (initialTime > 0) video.currentTime = initialTime;
        if (autoPlay) video.play();
      });
    }

    // Time update listener
    const handleTimeUpdate = () => {
        if (onTimeUpdate && video) {
            const duration = video.duration || 0;
            onTimeUpdate(video.currentTime, duration);
        }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [src, autoPlay]);

  // Handle seeking if initialTime changes prop-wise later (unlikely but good practice)
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - initialTime) > 2) {
        videoRef.current.currentTime = initialTime;
    }
  }, [initialTime]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-[0_0_30px_rgba(30,144,255,0.2)] border border-white/10 group">
      <video
        ref={videoRef}
        poster={poster}
        controls
        className="w-full h-full object-contain"
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
