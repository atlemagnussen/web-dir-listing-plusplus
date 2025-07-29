import { UserManager, type UserManagerSettings, Log, WebStorageStateStore } from "oidc-client-ts"
Log.setLogger(console)

const settings: UserManagerSettings = {
    authority: "https://id.atle.guru",
    client_id: "web",
    redirect_uri: "",
    popup_redirect_uri: `/popup.html`,
    response_type: "code",
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
}
const mgr = new UserManager(settings)

async function callbackFromPopup() {
    console.log("callbackFromPopup")
    try {
        await mgr.signinPopupCallback()
        console.log("callback-popup: signed in, closing window")
        window.close()
    }
    catch(err: any) {
        console.error(err)
        const message = err.message
        const main = document.querySelector("main")
        const errorMessage = main?.querySelector("section#error-message")
        const errorHtml = `<div class="error">
            <h2>Error occured while logging in</h2>
            <p class="msg"><i>${message}</i></p>
            
            <p><a href="${window.location.origin}">Try to log in again</a></p>
            </div>`
        if (errorMessage)
            errorMessage.innerHTML = errorHtml
        else {
            document.body.innerHTML = errorHtml
        }
    }
}
callbackFromPopup()