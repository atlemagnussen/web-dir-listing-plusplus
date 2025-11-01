// import all Web Awesome styles, including the default theme
import '@awesome.me/webawesome/dist/styles/webawesome.css';

// Optional: import your preferred theme
// import '@awesome.me/webawesome/dist/styles/themes/awesome.css';

// <wa-button>
import '@awesome.me/webawesome/dist/components/button/button.js';
// <wa-input>
import '@awesome.me/webawesome/dist/components/input/input.js';
import "@awesome.me/webawesome/dist/components/avatar/avatar.js"

// const modulesToLoad = [
//     "/components/button/button.js",
//     "/components/icon/icon.js",
//     "/components/tooltip/tooltip.js",
//     "/components/switch/switch.js",
//     "/components/popover/popover.js",
//     "/components/avatar/avatar.js",
//     "/components/dropdown/dropdown.js",
//     "/components/details/details.js"
// ]

//const mainCss = "/styles/themes/default.css"

//setBasePath(baseUrl)

// function createCss() {
//     const styleCss = document.createElement("link")
//     styleCss.rel = "stylesheet"
//     styleCss.href = `${baseUrl}${mainCss}`
//     document.head.appendChild(styleCss)
// }

// async function importComponents() {
//     createCss()

//     const promises = modulesToLoad.map(m => import(/* @vite-ignore */`${baseUrl}${m}`))

//     await Promise.all(promises)
//     return true
// }
