import "@awesome.me/webawesome/dist/styles/webawesome.css"
import "@awesome.me/webawesome/dist/components/button/button.js"
import "@awesome.me/webawesome/dist/components/icon/icon.js"
import "@awesome.me/webawesome/dist/components/input/input.js"
import "@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js"
import "@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js"
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js"
import "@awesome.me/webawesome/dist/components/spinner/spinner.js"
import "@awesome.me/webawesome/dist/components/switch/switch.js"
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js"
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js"
import "@awesome.me/webawesome/dist/components/drawer/drawer.js"
import "./styles/app.css"

import "./components/app-shell"

// Follow the OS light/dark setting.
const dark = matchMedia("(prefers-color-scheme: dark)")
const applyTheme = () => document.documentElement.classList.toggle("wa-dark", dark.matches)
dark.addEventListener("change", applyTheme)
applyTheme()
