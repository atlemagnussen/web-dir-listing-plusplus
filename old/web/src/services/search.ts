import http from "@app/stores/backendHttp"
import { FileOrDir } from "@common/types"

export async function searchFile(searchTerm: string) {
    const data = { searchTerm }
    const content = await http.put<FileOrDir[]>("searchfiles", data)
    return content
}