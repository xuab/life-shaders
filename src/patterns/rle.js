exports.parse = function (s) {
  const lines = s.replace(/^#.*$/gm, '').trim().split('\n')
  const res = /x = (\d+), y = (\d+),/.exec(lines[0])

  const w = parseInt(res[1])
  const h = parseInt(res[2])

  const rle = lines.slice(1).join('').replace(/(\d+)([ob$])/g, (_, n, c) => c.repeat(n))

  const dx = Math.floor(w / 2)
  const dy = Math.floor(h / 2)

  const deltas = []
  let row = 0
  let col = 0

  for (let i = 0; i < rle.length - 1; i += 1) {
    switch (rle[i]) {
      case '!': return
      case '$': row += 1; col = 0; continue
      case 'b': col += 1; continue
      case 'o': col += 1; deltas.push([row - dx, col - dy]); continue
    }
  }

  return deltas
}
