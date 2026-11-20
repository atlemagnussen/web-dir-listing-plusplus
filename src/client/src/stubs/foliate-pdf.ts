// Replaces foliate-js/pdf.js (see vite.config.ts): PDF support is not used, and its pdf.js
// vendor bundle can't be resolved by Vite.
export const makePDF = () => {
    throw new Error("PDF is not supported in the reader")
}
