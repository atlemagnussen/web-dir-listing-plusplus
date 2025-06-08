

import type { UserManagerSettings, UserLoadedCallback, UserSignedOutCallback } from "oidc-client-ts"
import { Log, UserManager, WebStorageStateStore } from "oidc-client-ts"
import { setAuthUser, setUserLoggedOut } from "@app/stores/userStore"

const logPrefix = "webDirOidc::"

const rootPath = window.location.origin
let oicdConfig: UserManagerSettings = {
    authority: "https://id.atle.guru",
    client_id: "web",
    redirect_uri: `${rootPath}/callback.html`,
    response_mode: "query",
    response_type: "code",
    scope:"openid profile api1",
    loadUserInfo: true,
    post_logout_redirect_uri: rootPath,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    accessTokenExpiringNotificationTimeInSeconds: 60,
    silentRequestTimeoutInSeconds: 20000,
    automaticSilentRenew: false,
    silent_redirect_uri: `${rootPath}/silent-renew.html`,
    monitorSession: true
}

Log.setLogger(console)
let manager = new UserManager(oicdConfig)

function addUserLoaded(fn: UserLoadedCallback) {
    manager.events.addUserLoaded(fn)
}
function addUserSignedOut(fn: UserSignedOutCallback) {
    manager.events.addUserSignedOut(fn)
}
let events = {
    addUserLoaded,
    addUserSignedOut
}
function setupEvents() {
    manager.events.addUserLoaded((user) => {
        const loadedMsg = `user ${user.profile.sub} loaded`
        logDebug(loadedMsg)
        setAuthUser(user)
    })
    manager.events.addUserUnloaded(() => {
        logDebug("user unloaded. Session terminated. user: ")
    })
    manager.events.addUserSignedIn(() => {
        logDebug(`user signed in`)
    })
    manager.events.addUserSignedOut(() => {
        logDebug("user signed OUT, if it was another tab, we need to do it here as well")
        setUserLoggedOut()
    })
    manager.events.addAccessTokenExpiring(() => {
        logDebug("access token soon expiring")
        silentRenew()
    })
    manager.events.addAccessTokenExpired(() => {
        logDebug("access token expired. Renew hopefully")
    })
    manager.events.addSilentRenewError(error => {
        logDebug(`error silent renew ${error.message}`)
    })
}
let isAlreadyRenewing = false
async function silentRenew () {
    logDebug(`silentRenew:: manual start, isAlreadyRenewing=${isAlreadyRenewing}`)
    if (isAlreadyRenewing)
        return
    try {
        isAlreadyRenewing = true
        const user = await manager.signinSilent()
        logDebug("silentRenew:: renewal successful")
        if (!user)
            throw new Error("User was null!")
        setAuthUser(user)
        return user
    } catch(err: any) {
        logError(`silentRenew:: Error from signinSilent: ${err.message}`)
    }
    finally {
        isAlreadyRenewing = false
        logDebug("silentRenew:: renewal done")
    }
    return
}

async function getUser() {
    const user = await manager.getUser()
    return user
}

async function getLoggedInUser() {
    const user = await manager.getUser()
    if (!user || user.expired) {
        log("no user means not logged in")
        return login()
    }
    else {
        return user
    }
}
function login() {
    manager.signinRedirect({ 
        state: window.location.href
    })
}

// Must be called initially
async function initialize(loggedOutUrl?: string, webStorage?: any) {
    if (loggedOutUrl)
        oicdConfig.post_logout_redirect_uri = loggedOutUrl

    if (webStorage)
        oicdConfig.userStore = new WebStorageStateStore({ store: window.localStorage })
    
    if (loggedOutUrl || webStorage)
        manager = new UserManager(oicdConfig)
    
    const user = await manager.getUser()
    if (!user || user.expired) {
        log("Not logged in")
        if (!user)
            log("No user")
        else
            log(`User expired=${user.expired}`)
        return null
    }
    else {
        setAuthUser(user)
        return user
    }
}
function signOut() {
    logDebug("sign out")
    manager.signoutRedirect()
}
function log(msg: string) {
    console.log(`${logPrefix} ${msg}`)
}
function logDebug(msg: string) {
    console.debug(`${logPrefix} ${msg}`)
}
function logError(msg: string) {
    console.error(`${logPrefix} ${msg}`)
}

setupEvents()

export default { 
    initialize,
    events,
    getLoggedInUser,
    getUser,
    login,
    signOut
}