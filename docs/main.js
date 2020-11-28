/* eslint-env browser */
import { h, render, showIfElse } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'
import { waveformEditor } from './waveformEditor.js'
import { midiInputs } from './midiInputs.js'
import { attachAudio } from './bezierTone.js'

render(document.querySelector('#bezierSynth'), h`
  ${showIfElse(() => !model.audioAttached, h`
    <button onclick=${el => attachAudio}>Attach Audio</button>
  `)}
  ${waveformEditor}
  ${midiInputs}
`)
