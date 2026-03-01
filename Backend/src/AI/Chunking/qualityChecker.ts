import { Document } from "@langchain/core/documents";


function qualitychunker(docs: Document[]): [Document[], Document[]] {
    let GoodChunk = docs.filter(doc => (doc.pageContent.length >= 100 && doc.pageContent.length <= 2000))

    let BadChunk = docs.filter(doc => (doc.pageContent.length < 100 || doc.pageContent.length > 2000));

    return [GoodChunk, BadChunk]
}

export default qualitychunker;