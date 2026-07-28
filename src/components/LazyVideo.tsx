import { useEffect, useRef, useState } from "react";

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
}

const LazyVideo = ({ src, poster, className, ...rest }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      preload="none"
      poster={poster}
      muted
      playsInline
      {...rest}
    >
      {visible && <source src={src} type="video/mp4" />}
    </video>
  );
};

export default LazyVideo;
