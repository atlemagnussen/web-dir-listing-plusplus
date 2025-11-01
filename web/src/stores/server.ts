import type { ConfigFolder } from "@wdl/common"
import http from "./backendHttp"

export async function getFolderContent(folderPath: string) {
    const content = await http.post<ConfigFolder>(folderPath)
    return content
}