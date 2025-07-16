export function rabinKarp(text: string, pattern: string): boolean {
  const d = 256; // jumlah karakter ASCII
  const q = 101; // bilangan prima buat modulo
  const m = pattern.length;
  const n = text.length;

  let h = 1;
  for (let i = 0; i < m - 1; i++) {
    h = (h * d) % q;
  }

  let p = 0; // hash untuk pattern
  let t = 0; // hash untuk text

  // hitung hash awal
  for (let i = 0; i < m; i++) {
    p = (d * p + pattern.charCodeAt(i)) % q;
    t = (d * t + text.charCodeAt(i)) % q;
  }

  for (let i = 0; i <= n - m; i++) {
    if (p === t) {
      let match = true;
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }

    // rolling hash
    if (i < n - m) {
      t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
      if (t < 0) t += q;
    }
  }

  return false;
}
