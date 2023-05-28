import type { SavedAudio } from "@common/types"

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

export async function saveAudioItem(data: SavedAudio) {
    await openDbPromise
    const exists = await getAudioItem(data.filePath)
    await saveOneItem(data, !!exists)
}

export async function getAudioItem(path:string) {
    await openDbPromise
    const value = await getOneIem<SavedAudio>(path)
    return value
}

