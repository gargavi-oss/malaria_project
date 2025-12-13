import { useEffect, useState } from "react";

export default function useMobile() {
  const [width, setWidth] = useState(window.innerWidth);

  const handleResize = () => setWidth(window.innerWidth);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width < 640,           // < 640px
    isTablet: width >= 640 && width < 1024, 
    isDesktop: width >= 1024        // ≥ 1024px
  };
}
