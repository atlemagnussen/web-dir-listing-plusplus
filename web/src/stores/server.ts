import type { ConfigFolder } from "@common/types"
import http from "./backendHttp"

export async function getFolderContent(folderPath: string) {
    const url = "foldercontent" + folderPath
    const content = await http.get<ConfigFolder>(url)
    return content
}