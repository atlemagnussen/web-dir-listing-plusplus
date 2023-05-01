import config from "./config"
import { splitDir } from "./common"

console.log(config)

const split1 = splitDir("/")
console.log("split1", split1)

const split2 = splitDir("/Audio")
console.log("split2", split2)

const split3 = splitDir("/Audio/Test.mp3")
console.log("split3", split3)