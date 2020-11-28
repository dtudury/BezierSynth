/* eslint-env browser */
import { h, render, showIfElse, watchFunction } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'
import { waveformEditor } from './waveformEditor.js'
import { midiInputs } from './midiInputs.js'

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
      bezierToneGenerator.onprocessorerror = console.error
      window.bezierToneGenerator = bezierToneGenerator
      watchFunction(() => {
        bezierToneGenerator.port.postMessage({ name: 'notes', value: JSON.parse(JSON.stringify(model.notes)) })
      })
    } catch (e) {
      return null
    }
  }
}

render(document.querySelector('#bezierSynth'), h`
  ${showIfElse(() => !model.audioAttached, h`
    <button onclick=${el => attachAudio}>Attach Audio</button>
  `)}
  ${waveformEditor}
  ${midiInputs}
`)
