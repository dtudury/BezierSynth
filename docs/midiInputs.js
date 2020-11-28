import { h, mapEntries, showIfElse } from './horseless.0.6.0.min.js'
import { model } from './MIDIModel.js'

export const midiInputs = h`
  <h1>MIDI Inputs</h1>
  ${mapEntries(() => model.inputs, (input, id) => {
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
  })}
`
