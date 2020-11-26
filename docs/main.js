/* eslint-env browser */
import { h, mapEntries, render, showIfElse, watchFunction } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'

let audioContext = null
async function attachAudio () {
  if (!audioContext) {
    model.audioAttached = true
    try {
      audioContext = new AudioContext()
      window.audioContext = audioContext
      await audioContext.resume()
      await audioContext.audioWorklet.addModule('BezierToneGenerator.js')
      const bezierToneGenerator = new AudioWorkletNode(audioContext, 'bezier-tone-generator')
      bezierToneGenerator.connect(audioContext.destination)
      // bezierToneGenerator.onprocessorerror(console.error)
      window.bezierToneGenerator = bezierToneGenerator
      watchFunction(() => {
        bezierToneGenerator.port.postMessage(JSON.parse(JSON.stringify(model.notes)))
      })
    } catch (e) {
      return null
    }
  }
}

const inputs = mapEntries(() => model.inputs, (input, id) => {
  const notes = model.notes[id] = model.notes[id] || []
  const open = el => e => {
    input.MIDIInput.open()
  }
  const close = el => e => {
    input.MIDIInput.close()
  }
  const channels = mapEntries(() => notes, (note, id) => {
    const controls = el => {
      return Object.entries(note.controls).map(([index, control]) => {
        return h`<div>${() => index} ${() => control}</div>`
      })
    }
    return h`
      <div style="padding: 5px; border: 1px solid black;">
        <h3>note ${note.index}</h3>
        <span>pressure: ${() => note.pressure}</span>
        <br>
        <span>bend: ${() => note.bend}</span>
        <div style="padding: 5px; border: 1px solid black;">
          <h4>controls</h4>
          ${controls}
        </div>
      </div>
    `
  })
  return h`
    <div style="padding: 5px; border: 1px solid black;">
      <h2>input: ${id}</h2>
      <span>name: ${() => input.name}</span>
      <br>
      <span>state: ${() => input.state}</span>
      <br>
      <span>connection: ${() => input.connection}</span>
      <br>
      ${showIfElse(() => input.connection === 'open', h`
        <button onclick=${close}>close</button>
      `, h`
        <button onclick=${open}>open</button>
      `)}
      ${channels}
    </div>
  `
})

render(document.querySelector('#bezierSynth'), h`
  ${showIfElse(() => !model.audioAttached, h`
    <button onclick=${el => attachAudio}>Attach Audio</button>
  `)}
  <h1>MIDI Inputs</h1>
  ${inputs}
`)
