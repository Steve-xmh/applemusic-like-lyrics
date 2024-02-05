import { parseTTML, exportTTML } from "../src"
document.getElementById("a")?.addEventListener("input", (evt) => {
    const target = evt.target as HTMLTextAreaElement;
    const lines = parseTTML(target.value);
    const b = document.getElementById("b") as HTMLTextAreaElement;
    b.value = exportTTML(lines, true);
    console.log(target.value === b.value);
});
