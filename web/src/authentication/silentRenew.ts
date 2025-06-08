import { UserManager, type UserManagerSettings, Log, WebStorageStateStore } from "oidc-client-ts"
Log.setLogger(console)

const settings: UserManagerSettings = {
    authority: "https://id.atle.guru",
    client_id: "web",
    redirect_uri: window.location.origin,
    loadUserInfo: true,
    response_mode: "query",
    response_type: "code",
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
}
const mgr = new UserManager(settings)
mgr.signinSilentCallback()