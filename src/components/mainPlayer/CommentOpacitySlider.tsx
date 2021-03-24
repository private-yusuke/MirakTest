import React, { useState } from "react"
import { useDebounce } from "react-use"
import { useRecoilState } from "recoil"
import { mainPlayerCommentOpacity } from "../../atoms/mainPlayer"

export const CommentOpacitySlider: React.VFC<{}> = () => {
  const [commentOpacity, setCommentOpacity] = useRecoilState(
    mainPlayerCommentOpacity
  )
  const [opacity, setOpacity] = useState(commentOpacity * 10)

  useDebounce(
    () => {
      setCommentOpacity(Math.ceil(opacity / 10))
    },
    100,
    [opacity]
  )

  return (
    <input
      aria-label="コメント濃度"
      type="range"
      min="0"
      max="10"
      value={opacity}
      onChange={(e) => {
        const p = parseInt(e.target.value)
        if (Number.isNaN(p)) return
        setOpacity(p)
      }}
    />
  )
}
