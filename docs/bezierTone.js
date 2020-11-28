/* eslint-env browser */

import { watchFunction } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'
let audioContext
let bezierToneGenerator
export async function attachAudio () {
  if (!bezierToneGenerator) {
    model.audioAttached = true
    try {
      audioContext = new AudioContext()
      window.audioContext = audioContext
      await audioContext.resume()
      await audioContext.audioWorklet.addModule('BezierToneGenerator.js')
      bezierToneGenerator = new AudioWorkletNode(audioContext, 'bezier-tone-generator')
      bezierToneGenerator.connect(audioContext.destination)
      bezierToneGenerator.onprocessorerror = console.error
      window.bezierToneGenerator = bezierToneGenerator
      watchFunction(() => {
        bezierToneGenerator.port.postMessage({ name: 'notes', value: JSON.parse(JSON.stringify(model.notes)) })
      })
      watchFunction(() => {
        bezierToneGenerator.port.postMessage({ name: 'waveforms', value: JSON.parse(JSON.stringify(model.waveforms)) })
      })
    } catch (e) {
      return null
    }
  }
  return bezierToneGenerator
}
