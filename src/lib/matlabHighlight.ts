/**
 * Minimal MATLAB syntax highlighting: comments, strings, keywords, numbers.
 * Returns escaped HTML with <span class="tok-…"> wrappers.
 */
const KEYWORDS = new Set([
  'if', 'else', 'elseif', 'end', 'for', 'while', 'function', 'return', 'break', 'continue', 'switch', 'case', 'otherwise', 'try', 'catch',
])

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function highlightLine(line: string): string {
  let out = ''
  let i = 0
  // a quote starts a string only after an operator / opening bracket / start (otherwise it is a transpose)
  const quoteStartsString = (k: number) => {
    let j = k - 1
    while (j >= 0 && line[j] === ' ') j--
    return j < 0 || /[=(,;[{+\-*/^:&|~<>]/.test(line[j]) || (line[j] === ' ' && false)
  }
  while (i < line.length) {
    const ch = line[i]
    if (ch === '%') {
      out += `<span class="tok-com">${esc(line.slice(i))}</span>`
      break
    }
    if (ch === "'" && quoteStartsString(i)) {
      let j = i + 1
      while (j < line.length) {
        if (line[j] === "'" && line[j + 1] === "'") j += 2
        else if (line[j] === "'") break
        else j++
      }
      out += `<span class="tok-str">${esc(line.slice(i, j + 1))}</span>`
      i = j + 1
      continue
    }
    const word = /^[A-Za-z_]\w*/.exec(line.slice(i))
    if (word) {
      const w = word[0]
      out += KEYWORDS.has(w) ? `<span class="tok-kw">${w}</span>` : esc(w)
      i += w.length
      continue
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(line.slice(i))
    if (num) {
      out += `<span class="tok-num">${num[0]}</span>`
      i += num[0].length
      continue
    }
    out += esc(ch)
    i++
  }
  return out
}
