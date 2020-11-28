import { h, mapEntries } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'

model.waveforms ??= [
  [
    { x: 0 / 12, y: 1, slope: 0 },
    { x: 3 / 12, y: -1, slope: 0 },
    { x: 6 / 12, y: 1, slope: 0 },
    { x: 9 / 12, y: -1, slope: 0 }
  ]
]

const mapX = x => x * 600
const unmapX = x => x / 600
const mapY = y => y * 50 + 150
const unmapY = y => (y - 150) / 50
const map = p => `${mapX(p.x)} ${mapY(p.y)}`
const moveTo = p => `M${map(p)}`
const curveTo = c => `C${map(c[0])},${map(c[1])},${map(c[2])}`

const pathData = el => {
  const waveform = model.waveforms[0]
  return `${moveTo(waveform[0])}${waveform.map((left, index) => {
    const rightIndex = (index + 1) % waveform.length
    const right = JSON.parse(JSON.stringify(waveform[rightIndex]))
    if (!rightIndex) right.x = 1
    const third = (right.x - left.x) / 3
    return curveTo([
      { x: left.x + third, y: left.y + third * left.slope },
      { x: right.x - third, y: right.y - third * right.slope },
      { x: right.x, y: right.y }
    ])
  })}`
}

const debugPathData = el => {
  const out = ''
  /*
  let prefix = 'M'
  const waveform = model.waveforms[0]
  for (let position = 0; position <= 100; ++position) {
    const waveformPosition = (position / 100) * waveform.length
    const step = Math.floor(waveformPosition)
    const p = waveformPosition % 1
    const i = 1 - p
    const left = waveform[(step + waveform.length - 1) % waveform.length]
    const right = waveform[(step + waveform.length + 0) % waveform.length]
    const a = left[2].y
    const b = right[0].y
    const c = right[1].y
    const d = right[2].y
    const v = a * i * i * i + 3 * b * i * i * p + 3 * c * i * p * p + d * p * p * p
    // const v = a * p + d * i
    out += prefix + mapX(position / 100) + ' ' + mapY(v)
    prefix = 'L'
  }
  */
  return out
}

export const waveformEditor = h`
  <h1>Waveform Editor</h1>
  <svg width="600px" height="300px" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid black; padding: 5px; box-sizing: border-box;">
    <rect x="0" y="100" width="600" height="100" fill="#eeeeee" />
    <path d="${pathData}" stroke-width="10" stroke="#ffffff" fill="none"/>
    <path d="${pathData}" stroke="#000000" fill="none"/>
    <path d="${debugPathData}" stroke="#ff0000" fill="none"/>
    ${mapEntries(() => model.waveforms[0], (control, index) => {
      /*
      const handleMouseDown = el => downEvent => {
        const begin = { x: control.x, y: control.y }
        console.log(downEvent)
        document.onmouseleave = e => {
          console.log('on mouse leave')
          document.onmouseleave = null
          document.onmousemove = null
          document.onmouseup = null
          // control.x = begin.x
          control.y = begin.y
        }
        document.onmousemove = e => {
          // control.x = begin.x + unmapX(e.screenX) - unmapX(downEvent.screenX)
          control.y = begin.y + unmapY(e.screenY) - unmapY(downEvent.screenY)
        }
        document.onmouseup = e => {
          console.log('on mouse up')
          document.onmouseleave = null
          document.onmousemove = null
          document.onmouseup = null
        }
      }
      */
      return h`
        <circle r="5" cx="${() => mapX(control.x)}" cy="${() => mapY(control.y)}">
      `
    })}
  </svg>
`
// <path d="${() => getPathData(model)}"/>
