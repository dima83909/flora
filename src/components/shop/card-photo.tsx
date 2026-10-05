"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

type CardPhotoProps = {
  /** Pre-sized card thumbnail, served straight from storage with a long browser cache */
  src: string
  /** Original photo, optimised by Next; used when the thumbnail does not exist (photos stored before thumbnails) */
  fallbackSrc: string
  alt: string
  sizes: string
  className?: string
}

/**
 * Catalog card photo. Vercel's image optimiser tells browsers to revalidate every photo
 * on each page load, so a card created after a filter change waits for a network round
 * trip and flashes empty. The thumbnail is cached by the browser outright and paints at once.
 */
export function CardPhoto({ src, fallbackSrc, alt, sizes, className }: CardPhotoProps) {
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  // The error can fire before hydration attaches onError, so check the finished image as well
  useEffect(() => {
    const img = ref.current
    if (img?.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  return failed ? (
    <Image src={fallbackSrc} alt={alt} fill sizes={sizes} className={className} />
  ) : (
    <Image ref={ref} src={src} alt={alt} fill unoptimized onError={() => setFailed(true)} className={className} />
  )
}
