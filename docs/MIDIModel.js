
import { proxy } from './horseless.0.6.0.min.js'

export const model = window.model = proxy({
  inputs: {}
})

const NOTE_OFF = 0b1000
const NOTE_ON = 0b1001
const KEY_PRESSURE = 0b1010
const CONTROL_CHANGE = 0b1011
const PROGRAM_CHANGE = 0b1100
const CHANNEL_PRESSURE = 0b1101
const PITCH_BEND = 0b1110
function parseMIDIData (bytes) {
  const prefix = bytes[0] >>> 4
  if (prefix < 0b1111) {
    const channel = bytes[0] & 0b1111
    switch (prefix) {
      case NOTE_OFF:
        return { type: NOTE_OFF, name: 'Note Off', channel, index: bytes[1], value: bytes[2], bytes }
      case NOTE_ON:
        return { type: NOTE_ON, name: 'Note On', channel, index: bytes[1], value: bytes[2], bytes }
      case KEY_PRESSURE:
        return { type: KEY_PRESSURE, name: 'Polyphonic Key Pressure', channel, index: bytes[1], value: bytes[2], bytes }
      case CONTROL_CHANGE:
        return { type: CONTROL_CHANGE, name: 'Control Change', channel, index: bytes[1], value: bytes[2], bytes }
      case PROGRAM_CHANGE:
        return { type: PROGRAM_CHANGE, name: 'Program Change', channel, value: bytes[1], bytes }
      case CHANNEL_PRESSURE:
        return { type: CHANNEL_PRESSURE, name: 'Channel Pressure', channel, value: bytes[1], bytes }
      case PITCH_BEND:
        return { type: PITCH_BEND, name: 'Pitch Bend', channel, value: bytes[1] | (bytes[2] << 7), bytes }
      default:
        console.error('midi parsing error', bytes)
        return {}
    }
  } else {
    return { bytes }
  }
}

navigator.requestMIDIAccess().then(midiAccess => {
  console.log(midiAccess)
  function updateIO (...args) {
    const existingKeys = new Set(Object.keys(model.inputs))
    Array.from(midiAccess.inputs.entries()).forEach(([id, MIDIInput]) => {
      model.inputs[id] = model.inputs[id] || {}
      function updateInput () {
        model.inputs[id].name = MIDIInput.name
        model.inputs[id].manufacturer = MIDIInput.manufacturer
        model.inputs[id].connection = MIDIInput.connection
        model.inputs[id].state = MIDIInput.state
        model.inputs[id].type = MIDIInput.type
        model.inputs[id].version = MIDIInput.version
        model.inputs[id].channels = model.inputs[id].channels || {}
      }
      function getChannel (channel) {
        model.inputs[id] = model.inputs[id] || {}
        model.inputs[id].channels = model.inputs[id].channels || {}
        model.inputs[id].channels[channel] = model.inputs[id].channels[channel] || { notes: {}, controls: {} }
        return model.inputs[id].channels[channel]
      }
      if (model.inputs[id].MIDIInput !== MIDIInput) {
        model.inputs[id].MIDIInput = MIDIInput
        MIDIInput.onstatechange = updateInput
        MIDIInput.onmidimessage = rawMessage => {
          const message = parseMIDIData(rawMessage.data)
          if (message.type) {
            switch (message.type) {
              case NOTE_ON:
                if (message.value) {
                  getChannel(message.channel).notes[message.index] = message.value
                } else {
                  delete getChannel(message.channel).notes[message.index]
                }
                break
              case NOTE_OFF:
                delete getChannel(message.channel).notes[message.index]
                break
              case CONTROL_CHANGE:
                if (message.value) {
                  getChannel(message.channel).controls[message.index] = message.value
                } else {
                  delete getChannel(message.channel).controls[message.index]
                }
                break
              case PITCH_BEND:
                getChannel(message.channel).bend = message.value
                break
              case CHANNEL_PRESSURE:
                getChannel(message.channel).pressure = message.value
                break
              default:
                console.log(id, message)
            }
          } else {
            console.log('unhandled', message)
          }
        }
      }
      updateInput()
      existingKeys.delete(id)
    })
    existingKeys.forEach(id => delete model.inputs[id])
  }
  midiAccess.onstatechange = updateIO
  updateIO()
})
