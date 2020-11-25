/* eslint-env browser */
import { h, mapEntries, render, showIfElse } from './horseless.0.6.0.min.js'
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
      const pressureParameter = bezierToneGenerator.parameters.get('pressure')
      window.pressureParameter = pressureParameter
      bezierToneGenerator.connect(audioContext.destination)
      window.bezierToneGenerator = bezierToneGenerator
    } catch (e) {
      return null
    }
  }
}

const inputs = mapEntries(() => model.inputs, (input, id) => {
  const open = el => e => {
    input.MIDIInput.open()
  }
  const close = el => e => {
    input.MIDIInput.close()
  }
  const channels = mapEntries(() => input.channels, (channel, id) => {
    const notes = el => {
      return Object.entries(channel.notes).map(([index, note]) => {
        return h`<div>${() => index} ${() => note}</div>`
      })
    }
    const controls = el => {
      return Object.entries(channel.controls).map(([index, control]) => {
        return h`<div>${() => index} ${() => control}</div>`
      })
    }
    return h`
      <div style="padding: 5px; border: 1px solid black;">
        <h3>channel ${id}</h3>
        <span>pressure: ${() => channel.pressure}</span>
        <br>
        <span>bend: ${() => channel.bend}</span>
        <div style="padding: 5px; border: 1px solid black;">
          <h4>notes</h4>
          ${notes}
        </div>
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
        ${channels}
      `, h`
        <button onclick=${open}>open</button>
      `)}
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
