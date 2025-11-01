import { WebStorageStateStore, Log } from "oidc-client-ts"
export { UserManager } from "oidc-client-ts"
Log.setLogger(console)

export const settings = {
    authority: "https://id.atle.guru",
    client_id: "web",
    redirect_uri: window.location.origin,
    loadUserInfo: true,
    response_mode: "query",
    response_type: "code",
    userStore: new WebStorageStateStore({ store: window.localStorage })
}