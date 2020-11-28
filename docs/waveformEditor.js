import { h, mapEntries } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'

model.waveforms ??= [
  [
    [
      { x: 1 / 12, y: 1 },
      { x: 2 / 12, y: -1 },
      { x: 3 / 12, y: -1 }
    ],
    [
      { x: 4 / 12, y: 1 },
      { x: 5 / 12, y: -1 },
      { x: 6 / 12, y: -1 }
    ],
    [
      { x: 7 / 12, y: 1 },
      { x: 8 / 12, y: -1 },
      { x: 9 / 12, y: -1 }
    ],
    [
      { x: 10 / 12, y: -1 },
      { x: 11 / 12, y: 1 },
      { x: 12 / 12, y: 1 }
    ]
  ]
]
/*
watchFunction(() => {
  bezierToneGenerator.port.postMessage({ name: 'notes', value: JSON.parse(JSON.stringify(model.notes)) })
})
*/

const mapX = x => x * 600
const unmapX = x => x / 600
const mapY = y => y * 50 + 150
const unmapY = y => (y - 150) / 50
const map = p => `${mapX(p.x)} ${mapY(p.y)}`
const moveTo = p => `M${map(p)}`
const curveTo = c => `C${map(c[0])},${map(c[1])},${map(c[2])}`

const pathData = el => {
  const waveform = model.waveforms[0]
  const p0 = { x: 0, y: waveform[waveform.length - 1][2].y }
  return `${moveTo(p0)}${waveform.map(curveTo)}`
}

export const waveformEditor = h`
  <h1>Waveform Editor</h1>
  <svg width="600px" height="300px" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid black; padding: 5px; box-sizing: border-box;">
    <rect x="0" y="100" width="600" height="100" fill="#eeeeee" />
    <path d="${pathData}" stroke-width="10" stroke="#ffffff" fill="none"/>
    <path d="${pathData}" stroke="#000000" fill="none"/>
    ${mapEntries(() => model.waveforms[0].flat(), control => {
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
      return h`<circle onmousedown=${handleMouseDown} r="5" cx="${() => mapX(control.x)}" cy="${() => mapY(control.y)}">`
    })}
  </svg>
`
// <path d="${() => getPathData(model)}"/>
