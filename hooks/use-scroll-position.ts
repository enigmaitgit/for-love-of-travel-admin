import { RefObject, useEffect, useState, useCallback } from 'react';

interface UseScrollPositionProps {
  targetRef?: RefObject<HTMLElement | Document | undefined>; // Ref to the scrollable element
}

export function useScrollPosition({
  targetRef,
}: UseScrollPositionProps = {}): number {
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  const updatePosition = useCallback(() => {
    // If the ref is not provided or its current value is null, fall back to document
    const target = targetRef?.current || document;
    const scrollable = target === document ? window : target;
    
    // Determine if we're scrolling the document or a specific element
    const scrollY =
      target === document
        ? window.scrollY
        : (target as HTMLElement).scrollTop;
    setScrollPosition(scrollY);
  }, [targetRef?.current]);

  useEffect(() => {
    // If the ref is not provided or its current value is null, fall back to document
    const target = targetRef?.current || document;
    const scrollable = target === document ? window : target;

    scrollable.addEventListener('scroll', updatePosition);

    // Set the initial position
    updatePosition();

    return () => {
      scrollable.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  return scrollPosition;
}
