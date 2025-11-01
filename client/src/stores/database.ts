import { splitFileName } from "@wdl/client/services/helpers.js"
import type { SavedAudio } from "@wdl/common"

let db: IDBDatabase | undefined

const DBNAME = "web-dir-listing"
const AUDIOTABLE = "audiostore"

function openDb() : Promise<IDBDatabase>{
    return new Promise((resolve, reject) => {
        const dbReq = indexedDB.open(DBNAME, 1)
        dbReq.onsuccess = () => {
            db = dbReq.result
            resolve(dbReq.result)
        }
        dbReq.onerror = (er) => {
            reject(er)
        }
        dbReq.onupgradeneeded = () => {
            let dbu = dbReq.result
            const objectAudioStore = dbu.createObjectStore(AUDIOTABLE, { keyPath: "filePath"})
            objectAudioStore.createIndex("filePath", "filePath", { unique: true })
            objectAudioStore.createIndex("audioProcess", "audioProcess", { unique: false })
        }
    })
}

const openDbPromise = openDb()

function getOneIem<T>(path: string): Promise<T> {
    
    return new Promise((resolve, reject) => {
        if (!db)
            reject("not connected")
        
        const store = db!.transaction([AUDIOTABLE]).objectStore(AUDIOTABLE)
        
        const req = store.get(path)
        req.onsuccess = () => resolve(req.result)
        req.onerror = err => reject(err)
    })
}

function getAll<T>(): Promise<T[]> {
    
    return new Promise((resolve, reject) => {
        if (!db)
            reject("not connected")
        
        const store = db!.transaction([AUDIOTABLE]).objectStore(AUDIOTABLE)
        
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = err => reject(err)
    })
}

function saveOneItem<T>(data: T, update: boolean): Promise<T> {
    return new Promise((resolve, reject) => {
        if (!db)
            reject("no db")
        
        const tx = db!.transaction([AUDIOTABLE], "readwrite")
        tx.onerror = er => {
            reject(er)
        }
        const objectStore = tx.objectStore(AUDIOTABLE)
        let req = update ? objectStore.put(data) : objectStore.add(data)
        
        req.onsuccess = () => {
            resolve(data)
        }
        req.onerror = ev => {
            reject(ev)
        }
    })
    
}

export async function saveAudioItem(filePath: string, audioProcess: number) {
    let params = new URLSearchParams(window.location.search)
    let fname = ""
    let fext = ""
    if (params.has("file")) {
        const { name, ext } = splitFileName(params.get("file")!)
        fname = name
        fext = ext
    }

    await openDbPromise
    const data: SavedAudio = {
        filePath,
        audioProcess,
        folderPath: window.location.pathname,
        name: fname,
        ext: fext
    }
    const exists = await getAudioItem(data.filePath)
    await saveOneItem(data, !!exists)
}

export async function getAudioItem(path:string) {
    await openDbPromise
    const value = await getOneIem<SavedAudio>(path)
    return value
}

export async function getAllAudioItems() {
    await openDbPromise
    const values = await getAll<SavedAudio>()
    return values
}
