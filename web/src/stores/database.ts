import type { SavedAudio } from "@common/types"

let db: IDBDatabase | undefined

const DBNAME = "web-dir-listing"
const AUDIOTABLE = "audiostore"

function openDb() : Promise<IDBDatabase>{
    return new Promise((resolve, reject) => {
        const dbReq = indexedDB.open(DBNAME, 1)
        dbReq.onsuccess = e => {
            console.log(e)
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
        
        const objectStore = db!.transaction([AUDIOTABLE]).objectStore(AUDIOTABLE)

        const req = objectStore.get(path)
        req.onsuccess = evt => {
            console.log("evt success", evt)
            resolve(req.result)
        }
    })
}

function saveOneItem<T>(data: T, update: boolean): Promise<T> {
    return new Promise((resolve, reject) => {
        if (!db)
            reject("no db")
        
        const tx = db!.transaction([AUDIOTABLE], "readwrite")
        tx.oncomplete = ev => {
            console.log("complete", ev)
        }
        tx.onerror = ev => {
            console.log("tx.error", ev)
        }
        const objectStore = tx.objectStore(AUDIOTABLE)
        let req = update ? objectStore.put(data) : objectStore.add(data)
        
        req.onsuccess = evt => {
            console.log("saved", evt)
            resolve(data)
        }
        req.onerror = ev => {
            console.log("req.err", ev)
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