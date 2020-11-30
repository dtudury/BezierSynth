import { h, mapEntries, showIfElse } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'

model.waveforms ??= [
  [
    { x: 0 / 12, y: 1, slope: 10 },
    { x: 3 / 12, y: -1, slope: -10 },
    { x: 6 / 12, y: 1, slope: 10 },
    { x: 9 / 12, y: -1, slope: -10 }
  ]
]

function getSVGPoint (x, y) {
  const point = document.querySelector('svg').createSVGPoint()
  point.x = x
  point.y = y
  return point
}

function getCoordsCTM () {
  return document.querySelector('#coords').getScreenCTM()
}

const transformX = x => getSVGPoint(x, 0).matrixTransform(getCoordsCTM().inverse()).x
const transformY = y => getSVGPoint(0, y).matrixTransform(getCoordsCTM().inverse()).y
const transform = (x, y) => getSVGPoint(x, y).matrixTransform(getCoordsCTM().inverse())

const mapX = x => x * 600
const mapY = y => y * 50 + 150

const pathData = el => {
  const waveform = model.waveforms[0]
  // return `${moveTo(waveform[0])}${waveform.map((left, index) => {
  return `M${waveform[0].x} ${waveform[0].y}${waveform.map((left, index) => {
    const rightIndex = (index + 1) % waveform.length
    const right = JSON.parse(JSON.stringify(waveform[rightIndex]))
    if (!rightIndex) right.x = 1
    const third = (right.x - left.x) / 3
    return `C${left.x + third} ${left.y + third * left.slope},${right.x - third} ${right.y - third * right.slope},${right.x} ${right.y}`
  })}`
}

const addPoint = el => e => {
  if (!e.shiftKey) return
  const { x, y } = transform(e.clientX, e.clientY)
  const waveform = model.waveforms[0]
  let index = waveform.length - 1
  while (waveform[index].x > x && index) index--
  const left = waveform[index]
  const actualRight = waveform[(index + 1) % waveform.length]
  const right = { x: actualRight.x || 1, y: actualRight.y, slope: actualRight.slope }
  const dx = ((index === waveform.length - 1) ? 1 : right.x) - left.x
  const third = dx / 3
  const p = (x - left.x) / dx
  function subdivide (points) {
    console.log(points)
    if (points.length === 1) return points
    const step = []
    for (let i = 1; i < points.length; ++i) {
      const left = points[i - 1]
      const right = points[i]
      step.push({ x: left.x * (1 - p) + right.x * p, y: left.y * (1 - p) + right.y * p })
    }
    return [points[0], ...subdivide(step), points[points.length - 1]]
  }
  const [,, c, d] = subdivide([
    left,
    { x: left.x + third, y: left.y + third * left.slope },
    { x: right.x - third, y: right.y - third * right.slope },
    right
  ])
  waveform.splice(index, 0, { x: d.x, y: d.y, slope: (d.y - c.y) / (d.x - c.x) })
  console.log(x, y)
}

export const waveformEditor = h`
  <h1>Waveform Editor</h1>
  <svg width="100%" height="400px" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid black; padding: 5px; box-sizing: border-box;">
    <g transform="scale(600 50) translate(0 3)">
      <rect id="coords" x="0" y="-1" width="1" height="2" fill="#eeeeee"/>
      <path onclick=${addPoint} d="${pathData}" stroke-width="10" vector-effect="non-scaling-stroke" stroke="#ffffff" fill="none"/>
      <path style="pointer-events: none;" d="${pathData}" stroke="#000000" stroke-width="0.01" fill="none"/>
    </g>
    ${mapEntries(() => model.waveforms, waveform => mapEntries(() => waveform.sort((a, b) => a.x - b.x), control => {
      const startDrag = f => el => downEvent => {
        if (downEvent.shiftKey) {
          waveform.splice(waveform.indexOf(control), 1)
          return
        }
        const begin = { x: control.x, y: control.y }
        document.onmouseleave = e => {
          document.onmouseleave = null
          document.onmousemove = null
          document.onmouseup = null
          f(begin.x, begin.y)
        }
        document.onmousemove = e => {
          f(transformX(e.clientX), transformY(e.clientY))
        }
        document.onmouseup = e => {
          document.onmouseleave = null
          document.onmousemove = null
          document.onmouseup = null
        }
      }
      const getControlX = () => mapX(control.x)
      const getControlY = () => mapY(control.y)
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
        control.x = waveform.indexOf(control) ? x : 0
        control.y = y
      })
      const startDragLeft = startDrag((x, y) => {
        control.slope = (y - control.y) / (x - getControlXForLeft())
      })
      const startDragRight = startDrag((x, y) => {
        control.slope = (y - control.y) / (x - control.x)
      })
      return h`
        <line 
          x1="${getControlX}"
          y1="${getControlY}" 
          x2="${getRightControlX}" 
          y2="${getRightControlY}"
          stroke="blue"
        />
        ${showIfElse(() => waveform.indexOf(control), h`
          <line 
            x1="${getLeftControlX}" 
            y1="${getLeftControlY}" 
            x2="${getControlX}"
            y2="${getControlY}"
            stroke="red"
          />
          <circle r="5" onmousedown=${startDragLeft} cx="${getLeftControlX}" cy="${getLeftControlY}" fill="red"/>
        `, h`
          <line 
            x1="${getLeftControlX}" 
            y1="${getLeftControlY}" 
            x2="${() => mapX(1)}" 
            y2="${getControlY}"
            stroke="red"
          />
          <circle r="5" onmousedown=${startDragLeft} cx="${getLeftControlX}" cy="${getLeftControlY}" fill="red"/>
          <circle r="5" onmousedown=${startDragControl} cx="${() => mapX(1)}" cy="${getControlY}"/>
        `)}
        <circle r="5" onmousedown=${startDragRight} cx="${getRightControlX}" cy="${getRightControlY}" fill="blue"/>
        <circle r="5" onmousedown=${startDragControl} cx="${getControlX}" cy="${getControlY}"/>
      `
    }))}
  </svg>
`
