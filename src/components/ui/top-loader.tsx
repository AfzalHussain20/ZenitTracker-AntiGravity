
"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // For route changes
    handleStop(); // Stop any existing progress bar on new page load
    
    // The following is a bit of a workaround for Next.js App Router.
    // We can't use router events as they don't exist.
    // Instead we rely on the path changing.
    handleStart(); // Start on path change
    
    // We add a slight delay to `done` to account for rendering time.
    const timer = setTimeout(() => {
      handleStop();
    }, 200);

    return () => {
      clearTimeout(timer);
      // We don't call handleStop here as it can cause flickering
      // when navigating between pages. The effect will re-run anyway.
    };
  }, [pathname, searchParams]);

  return (
     <style jsx global>{`
        #nprogress {
          pointer-events: none;
        }
        #nprogress .bar {
          background: hsl(var(--primary));
          position: fixed;
          z-index: 1031;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }
        #nprogress .peg {
          display: block;
          position: absolute;
          right: 0px;
          width: 100px;
          height: 100%;
          box-shadow: 0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary));
          opacity: 1.0;
          transform: rotate(3deg) translate(0px, -4px);
        }
      `}</style>
  );
}
