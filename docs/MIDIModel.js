
import { proxy } from './horseless.0.6.0.min.js'

export const model = window.model = proxy({
  inputs: {},
  notes: {}
})
model.notes[0] = [{ index: 69 - 24, pressure: 40, controls: {} }]

// channel voice messages
const CHANNEL_VOICE_MESSAGE = 'Channel Voice Message'
const NOTE_OFF = 0b1000
const NOTE_ON = 0b1001
const KEY_PRESSURE = 0b1010
const CONTROL_CHANGE = 0b1011
const PROGRAM_CHANGE = 0b1100
const CHANNEL_PRESSURE = 0b1101
const PITCH_BEND = 0b1110

// channel mode messages
const CHANNEL_MODE_MESSAGE = 'Channel Mode Message'
const ALL_SOUND_OFF = 120
const RESET_ALL_CONTROLLERS = 121
const LOCAL_CONTROL = 122
const ALL_NOTES_OFF = 123
const OMNI_MODE_OFF = 124
const OMNI_MODE_ON = 125
const MONO_MODE_ON = 126
const POLY_MODE_ON = 127

// system common messages
const SYSTEM_COMMON_MESSAGE = 'System Common Message'
const SYSTEM_EXCLUSIVE = 0b11110000
const MIDI_TIME_CODE_QUARTER_FRAME = 0b11110001
const SONG_POSITION_POINTER = 0b11110010
const SONG_SELECT = 0b11110011
// RESERVED 0b11110100
// RESERVED 0b11110101
const TUNE_REQUEST = 0b11110110
const END_OF_EXCLUSIVE = 0b11110111

// system real-time messages
const SYSTEM_REALTIME_MESSAGE = 'System Real-Time Message'
const TIMING_CLOCK = 0b11111000
// RESERVED 0b11111001
const START = 0b11111010
const CONTINUE = 0b11111011
const STOP = 0b11111100
// RESERVED 0b11111101
const ACTIVE_SENSING = 0b11111110
const RESET = 0b11111111

function parseMIDIData (bytes) {
  const prefix = bytes[0] >>> 4
  if (prefix === 0b1111) {
    switch (bytes[0]) {
      case SYSTEM_EXCLUSIVE:
        return { category: SYSTEM_COMMON_MESSAGE, type: SYSTEM_EXCLUSIVE, name: 'System Exclusive', bytes }
      case MIDI_TIME_CODE_QUARTER_FRAME:
        return { category: SYSTEM_COMMON_MESSAGE, type: MIDI_TIME_CODE_QUARTER_FRAME, name: 'MIDI Time Code Quarter Frame', bytes }
      case SONG_POSITION_POINTER:
        return { category: SYSTEM_COMMON_MESSAGE, type: SONG_POSITION_POINTER, name: 'Song Posisition Pointer', bytes }
      case SONG_SELECT:
        return { category: SYSTEM_COMMON_MESSAGE, type: SONG_SELECT, name: 'Song Select', bytes }
      case TUNE_REQUEST:
        return { category: SYSTEM_COMMON_MESSAGE, type: TUNE_REQUEST, name: 'Tune Request', bytes }
      case END_OF_EXCLUSIVE:
        return { category: SYSTEM_COMMON_MESSAGE, type: END_OF_EXCLUSIVE, name: 'End of Exclusive', bytes }
      case TIMING_CLOCK:
        return { category: SYSTEM_REALTIME_MESSAGE, type: TIMING_CLOCK, name: 'Timing Clock', bytes }
      case START:
        return { category: SYSTEM_REALTIME_MESSAGE, type: START, name: 'Start', bytes }
      case CONTINUE:
        return { category: SYSTEM_REALTIME_MESSAGE, type: CONTINUE, name: 'Continue', bytes }
      case STOP:
        return { category: SYSTEM_REALTIME_MESSAGE, type: STOP, name: 'Stop', bytes }
      case ACTIVE_SENSING:
        return { category: SYSTEM_REALTIME_MESSAGE, type: ACTIVE_SENSING, name: 'Active Sensing', bytes }
      case RESET:
        return { category: SYSTEM_REALTIME_MESSAGE, type: RESET, name: 'Reset', bytes }
    }
  } else {
    const channel = bytes[0] & 0b1111
    switch (prefix) {
      case NOTE_OFF:
        return { category: CHANNEL_VOICE_MESSAGE, type: NOTE_OFF, name: 'Note Off', channel, index: bytes[1], value: bytes[2], bytes }
      case NOTE_ON:
        return { category: CHANNEL_VOICE_MESSAGE, type: NOTE_ON, name: 'Note On', channel, index: bytes[1], value: bytes[2], bytes }
      case KEY_PRESSURE:
        return { category: CHANNEL_VOICE_MESSAGE, type: KEY_PRESSURE, name: 'Polyphonic Key Pressure', channel, index: bytes[1], value: bytes[2], bytes }
      case CONTROL_CHANGE:
        switch (bytes[1]) {
          case ALL_SOUND_OFF:
            return { category: CHANNEL_MODE_MESSAGE, type: ALL_SOUND_OFF, name: 'All Sound Off', channel, value: bytes[2], bytes }
          case RESET_ALL_CONTROLLERS:
            return { category: CHANNEL_MODE_MESSAGE, type: RESET_ALL_CONTROLLERS, name: 'Reset All Controllers', channel, value: bytes[2], bytes }
          case LOCAL_CONTROL:
            return { category: CHANNEL_MODE_MESSAGE, type: LOCAL_CONTROL, name: 'Local Control', channel, value: bytes[2], bytes }
          case ALL_NOTES_OFF:
            return { category: CHANNEL_MODE_MESSAGE, type: ALL_NOTES_OFF, name: 'All Notes Off', channel, value: bytes[2], bytes }
          case OMNI_MODE_OFF:
            return { category: CHANNEL_MODE_MESSAGE, type: OMNI_MODE_OFF, name: 'Omni Mode Off', channel, value: bytes[2], bytes }
          case OMNI_MODE_ON:
            return { category: CHANNEL_MODE_MESSAGE, type: OMNI_MODE_ON, name: 'Omni Mode On', channel, value: bytes[2], bytes }
          case MONO_MODE_ON:
            return { category: CHANNEL_MODE_MESSAGE, type: MONO_MODE_ON, name: 'Mono Mode On', channel, value: bytes[2], bytes }
          case POLY_MODE_ON:
            return { category: CHANNEL_MODE_MESSAGE, type: POLY_MODE_ON, name: 'Poly Mode On', channel, value: bytes[2], bytes }
          default:
            return { category: CHANNEL_VOICE_MESSAGE, type: CONTROL_CHANGE, name: 'Control Change', channel, index: bytes[1], value: bytes[2], bytes }
        }
      case PROGRAM_CHANGE:
        return { category: CHANNEL_VOICE_MESSAGE, type: PROGRAM_CHANGE, name: 'Program Change', channel, value: bytes[1], bytes }
      case CHANNEL_PRESSURE:
        return { category: CHANNEL_VOICE_MESSAGE, type: CHANNEL_PRESSURE, name: 'Channel Pressure', channel, value: bytes[1], bytes }
      case PITCH_BEND:
        return { category: CHANNEL_VOICE_MESSAGE, type: PITCH_BEND, name: 'Pitch Bend', channel, value: bytes[1] | (bytes[2] << 7), bytes }
    }
    console.error('midi parsing error', bytes)
    return { bytes }
  }
}

navigator.requestMIDIAccess().then(midiAccess => {
  console.log(midiAccess)
  function updateIO (...args) {
    const existingKeys = new Set(Object.keys(model.inputs))
    Array.from(midiAccess.inputs.entries()).forEach(([id, MIDIInput]) => {
      const controls = {}
      const input = model.inputs[id] = model.inputs[id] || {}
      // const notes = model.notes[id] = model.notes[id] || [{ controls }] // some proxy magic clones controls
      const notes = []
      model.notes[id] = [{ index: 69, pressure: 40, controls }]
      function updateInput () {
        if (!MIDIInput) return
        input.name = MIDIInput.name
        input.manufacturer = MIDIInput.manufacturer
        input.connection = MIDIInput.connection
        input.state = MIDIInput.state
        input.type = MIDIInput.type
        input.version = MIDIInput.version
        input.channels = input.channels || {}
      }
      if (input.MIDIInput !== MIDIInput) {
        input.MIDIInput = MIDIInput
        MIDIInput.onstatechange = updateInput
        MIDIInput.onmidimessage = rawMessage => {
          const message = parseMIDIData(rawMessage.data)
          const type = message.type
          const index = message.index
          const value = message.value

          function stopNote () {
            if (notes.length === 1) {
              notes[0].index = index
              notes[0].pressure = 0
            } else {
              for (let i = 0; i < notes.length; ++i) {
                if (notes[i].index === index) {
                  notes.splice(i, 1)
                  return
                }
              }
              console.error('we tried to stop a note we did not start', JSON.stringify(model.notes, null, ' . '))
              throw new Error(`we tried to stop a note we did not start ${JSON.stringify(message)}`)
            }
          }

          function startNote () {
            notes.unshift({ index, pressure: value, controls }) // some proxy magic clones controls
            if (notes[1]) {
              notes[0].bend = notes[1].bend
            }
            for (let i = notes.length - 1; i; --i) {
              if (!notes[i].pressure) {
                notes.splice(i, 1)
              }
            }
          }

          if (type) {
            switch (type) {
              case NOTE_ON:
                if (value) {
                  startNote()
                  // console.log('starting', index, JSON.stringify(model.notes, null, ' . '))
                } else {
                  stopNote()
                  // console.log('stopping with zero', index, JSON.stringify(model.notes, null, ' . '))
                }
                break
              case NOTE_OFF:
                stopNote()
                // console.log('stopping', index, JSON.stringify(model.notes, null, ' . '))
                break
              case CONTROL_CHANGE:
                notes.forEach(note => { note.controls[index] = value || 0 })
                break
              case PITCH_BEND:
                notes.forEach(note => { note.bend = value })
                break
              case CHANNEL_PRESSURE:
                notes.forEach(note => { note.pressure &&= value })
                break
              default:
                console.error('unhandled', id, message)
            }
          } else {
            console.error('unhandled system', message)
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
