import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { createRoot } from "react-dom/client"
import Recoil from "recoil"
import RecoilSync from "recoil-sync"
import { PluginLoader } from "./Plugin"
import { Splash } from "./components/global/Splash"
import { InitialData } from "./types/struct"
import "./index.scss"

global.React = React
global.Recoil = Recoil
global.RecoilSync = RecoilSync

const WebRoot: React.FC<{}> = () => {
  const [unmounted, setUnmounted] = useState(false)
  useEffect(() => {
    const app = document.getElementById("app")
    if (!app) return
    const beforeUnload = () => {
      setUnmounted(true)
      ReactDOM.unmountComponentAtNode(app)
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => {
      window.removeEventListener("beforeunload", beforeUnload)
    }
  }, [])
  const [initialData, setInitialData] = useState<InitialData | null>(null)
  useEffect(() => {
    window.Preload.requestInitialData().then((data) => {
      window.id = data.windowId
      setInitialData(data)
    })
  }, [])
  if (unmounted || initialData === null) {
    return <Splash />
  }
  return <PluginLoader {...initialData} />
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("app")!).render(<WebRoot />)
