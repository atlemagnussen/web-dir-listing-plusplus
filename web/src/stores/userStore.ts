import { BehaviorSubject } from "rxjs"
import type { User } from "oidc-client-ts"

export interface AuthUser {
    accessToken?: string
}

const userSubject = new BehaviorSubject<AuthUser>({})

export const authUser = userSubject.asObservable()

export function setAuthUser(oidcUser: User) {
    const authUser: AuthUser = {
        accessToken: oidcUser.access_token
    }
    userSubject.next(authUser)
}

export function setUserLoggedOut() {
    userSubject.next({})
}