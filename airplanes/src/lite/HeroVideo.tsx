import { useEffect, useRef, useState } from 'react'
import { ASSETS, assetUrl } from '../lib/assets'
import { loopsOn, store, useApp } from '../state/store'

/**
 * Lighter version of the hero (PRD F7): an 8 s seamless, muted video loop over the poster. It plays
 * only while loops are on (not paused, not reduced motion, tab visible) and the hero is on screen,
 * never autoplays under reduced motion, and leaves the poster showing if the files are missing or
 * fail. The poster <picture> itself belongs to the hero, so nothing jumps when the video arrives.
 */
export default function HeroVideo() {
  const reduced = useApp((s) => s.motion.reduced)
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video || reduced || failed) return
    let visible = true
    const sync = () => {
      if (loopsOn(store.getState()) && visible) {
        video.play().catch(() => {
          /* autoplay refused (or no source): the poster stays */
        })
      } else video.pause()
    }
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => ((visible = e.isIntersecting), sync())) : null
    io?.observe(video)
    const unsub = store.subscribe(sync)
    sync()
    return () => {
      io?.disconnect()
      unsub()
      video.pause()
    }
  }, [reduced, failed])

  if (reduced || failed) return null
  const fail = () => setFailed(true)
  return (
    <video
      ref={ref}
      className="hero__video"
      data-playing={playing ? 'true' : 'false'}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
      onPlaying={() => setPlaying(true)}
      onError={fail}
    >
      <source src={assetUrl(ASSETS.video.heroWebm)} type="video/webm" />
      <source src={assetUrl(ASSETS.video.heroMp4)} type="video/mp4" onError={fail} />
    </video>
  )
}
