import { h, mapEntries, showIfElse } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'

model.waveforms ??= [
  [
    { x: 0 / 12, y: 1, slope: 1 },
    { x: 3 / 12, y: -1, slope: -1 },
    { x: 6 / 12, y: 1, slope: 1 },
    { x: 9 / 12, y: -1, slope: -1 }
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
  const waveform = model.waveforms[0].sort((a, b) => a.x - b.x)
  for (let position = 0; position <= 100; ++position) {
    const x = position / 100
    let index = waveform.length - 1
    while (waveform[index].x > x && index) index--
    const left = waveform[index]
    const right = waveform[(index + 1) % waveform.length]
    const dx = ((index === waveform.length - 1) ? 1 : right.x) - left.x
    const third = dx / 3
    const a = left.y
    const b = left.y + left.slope * third
    const c = right.y - right.slope * third
    const d = right.y
    const p = (x - left.x) / dx
    const i = 1 - p
    const v = a * i * i * i + 3 * b * i * i * p + 3 * c * i * p * p + d * p * p * p
    out += prefix + mapX(x) + ' ' + mapY(v)
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
    ${mapEntries(() => model.waveforms, waveform => mapEntries(() => waveform.sort((a, b) => a.x - b.x), control => {
      const startDrag = f => el => downEvent => {
        const begin = { x: control.x, y: control.y }
        console.log(downEvent)
        document.onmouseleave = e => {
          console.log('on mouse leave')
          document.onmouseleave = null
          document.onmousemove = null
          document.onmouseup = null
          f(begin.x, begin.y)
        }
        document.onmousemove = e => {
          f(begin.x + unmapX(e.screenX) - unmapX(downEvent.screenX), begin.y + unmapY(e.screenY) - unmapY(downEvent.screenY))
        }
        document.onmouseup = e => {
          console.log('on mouse up')
          document.onmouseleave = null
          document.onmousemove = null
          document.onmouseup = null
        }
      }
      const getControlXForLeft = () => waveform.indexOf(control) ? control.x : 1
      const getRight = () => waveform[(waveform.indexOf(control) + 1) % waveform.length]
      const getRightThird = () => (((waveform.indexOf(control) === waveform.length - 1) ? 1 : getRight().x) - control.x) / 3
      const getRightControlX = () => mapX(control.x + getRightThird())
      const getRightControlY = () => mapY(control.y + getRightThird() * control.slope)
      const getLeft = () => waveform[(waveform.indexOf(control) + waveform.length - 1) % waveform.length]
      const getLeftThird = () => (getControlXForLeft() - getLeft().x) / 3
      const getLeftControlX = () => mapX(getControlXForLeft() - getLeftThird())
      const getLeftControlY = () => mapY(control.y - getLeftThird() * control.slope)

      const startDragControl = startDrag((x, y) => {
        if (waveform.indexOf(control)) {
          control.x = x
        } else {
          control.x = 0
        }
        control.y = y
      })
      const startDragLeft = startDrag((x, y) => {
        control.slope = (y - control.y) / (x - control.x - getLeftThird())
      })
      const startDragRight = startDrag((x, y) => {
        control.slope = (y - control.y) / (x - control.x + getRightThird())
      })
      return h`
        <line 
          x1="${() => mapX(control.x)}" 
          y1="${() => mapY(control.y)}" 
          x2="${getRightControlX}" 
          y2="${getRightControlY}"
          stroke="blue"
        />
        ${showIfElse(() => waveform.indexOf(control), h`
          <line 
            x1="${getLeftControlX}" 
            y1="${getLeftControlY}" 
            x2="${() => mapX(control.x)}" 
            y2="${() => mapY(control.y)}"
            stroke="red"
          />
          <circle r="5" onmousedown=${startDragLeft} cx="${getLeftControlX}" cy="${getLeftControlY}" fill="red"/>
        `, h`
          <line 
            x1="${getLeftControlX}" 
            y1="${getLeftControlY}" 
            x2="${() => mapX(1)}" 
            y2="${() => mapY(control.y)}"
            stroke="red"
          />
          <circle r="5" onmousedown=${startDragLeft} cx="${getLeftControlX}" cy="${getLeftControlY}" fill="red"/>
          <circle r="5" onmousedown=${startDragControl} cx="${() => mapX(1)}" cy="${() => mapY(control.y)}"/>
        `)}
        <circle r="5" onmousedown=${startDragRight} cx="${getRightControlX}" cy="${getRightControlY}" fill="blue"/>
        <circle r="5" onmousedown=${startDragControl} cx="${() => mapX(control.x)}" cy="${() => mapY(control.y)}"/>
      `
    }))}
  </svg>
`
