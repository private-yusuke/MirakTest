import { CanvasProvider } from "aribb24.js"
import clsx from "clsx"
import React, { memo, useEffect, useRef, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import {
  mainPlayerAribSubtitleData,
  mainPlayerDisplayingAribSubtitleData,
  mainPlayerIsPlaying,
  mainPlayerPlayingTime,
  mainPlayerSubtitleEnabled,
  mainPlayerTsFirstPcr,
} from "../../atoms/mainPlayer"
import { useRefFromState } from "../../hooks/ref"
import { tryBase64ToUint8Array } from "../../utils/string"

export const CoiledSubtitleRenderer: React.VFC<{}> = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const isSubtitleEnabled = useRecoilValue(mainPlayerSubtitleEnabled)
  const isPlaying = useRecoilValue(mainPlayerIsPlaying)
  const setDisplayingAribSubtitleData = useSetRecoilState(
    mainPlayerDisplayingAribSubtitleData
  )
  const isPlayingRef = useRefFromState(isPlaying)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    if (isPlaying === false) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      setDisplayingAribSubtitleData(null)
    }
  }, [isPlaying])

  const [height, setHeight] = useState("100%")
  // 画面リサイズ時にキャンバスも追従させる
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onResize = () => {
      const { width } = canvas.getBoundingClientRect()
      setHeight(`${Math.ceil(width / 1.777777778)}px`)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])

  // 字幕ペイロード更新時にパースしたデータをレンダリングする
  const aribSubtitleData = useRecoilValue(mainPlayerAribSubtitleData)
  const firstPcr = useRecoilValue(mainPlayerTsFirstPcr)
  const playingTime = useRecoilValue(mainPlayerPlayingTime)
  const displayingSubtitle = useRef("")
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !firstPcr) return
    const context = canvas.getContext("2d")
    if (!context) return
    if (!aribSubtitleData) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      setDisplayingAribSubtitleData(null)
      return
    }
    const decoded = tryBase64ToUint8Array(aribSubtitleData.data)
    if (!decoded) return
    const fromZero = ((aribSubtitleData.pts * 9) / 100 - firstPcr) / 90_000
    const pts = fromZero - playingTime / 1000
    const provider = new CanvasProvider(decoded, pts)
    const estimate = provider.render()
    if (!estimate) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    setTimeout(() => {
      if (isPlayingRef.current === false) return
      provider.render({
        canvas,
        useStrokeText: true,
        keepAspectRatio: true,
        normalFont: "'Rounded M+ 1m for ARIB'",
        gaijiFont: "'Rounded M+ 1m for ARIB'",
      })
      setDisplayingAribSubtitleData(decoded)
      displayingSubtitle.current = aribSubtitleData.data
      if (estimate.endTime === Number.MAX_SAFE_INTEGER) return
      setTimeout(() => {
        if (displayingSubtitle.current !== aribSubtitleData.data) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        displayingSubtitle.current = ""
        setDisplayingAribSubtitleData(null)
      }, (estimate.endTime - estimate.startTime) * 1000)
    }, estimate.startTime * 1000)
  }, [aribSubtitleData])

  return (
    <canvas
      width={1920}
      height={1080}
      className={clsx(
        "pointer-events-none",
        "w-full",
        !isSubtitleEnabled && "opacity-0"
      )}
      style={{ height }}
      ref={canvasRef}
    ></canvas>
  )
})
