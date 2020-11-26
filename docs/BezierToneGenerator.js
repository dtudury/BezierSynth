/* eslint-env browser */
/* global sampleRate */

class BezierToneGenerator extends AudioWorkletProcessor {
  constructor () {
    super()
    this.notesByInput = {}
    this.port.onmessage = e => this.handleMessage(e)
  }

  handleMessage (e) {
    for (const id in e.data) {
      const notes = this.notesByInput[id] ||= []
      const inNotes = e.data[id]
      let i = 0
      while (i < inNotes.length) {
        const note = notes[i] ||= { index: {}, pressure: {}, bend: {}, controls: {}, position: 0 }
        const inNote = inNotes[i]
        note.index.target = inNote.index
        note.pressure.target = inNote.pressure
        note.pressure.value ||= 0
        note.bend.target = inNote.bend
        for (const number in inNote.controls) {
          const control = note.controls[number] ||= {}
          control.target = inNote.controls[number]
        }
        ++i
      }
      while (i < notes.length) {
        const note = notes[i]
        note.pressure.target = 0
        ++i
      }
    }
  }

  calculateNotes (dt) {
    function calculateValue (obj) {
      const a = 1000
      const dampness = 0.999
      obj.value ??= obj.target
      obj.dv ??= 0
      obj.dv = (obj.dv + (obj.target - obj.value) * a * dt) * dampness
      obj.value += obj.dv * dt
      if (Math.abs(obj.dv) < 0.01 && Math.abs(obj.target - obj.value) < 0.1) {
        obj.dv = 0
        obj.value = obj.target
      }
    }
    for (const id in this.notesByInput) {
      const notes = this.notesByInput[id] ||= []
      notes.forEach(note => {
        calculateValue(note.index)
        calculateValue(note.pressure)
        calculateValue(note.bend)
        for (const number in note.controls) {
          calculateValue(note.controls[number])
        }
      })
      for (let i = notes.length - 1; i >= 0; --i) {
        const note = notes[i]
        if (!note.pressure.value) {
          notes.splice(i, 1)
        }
      }
    }
  }

  play (note) {
    const frequency = 440 * Math.pow(2, (note.index.value - 69) / 12)
    note.position = (note.position + frequency / sampleRate) % 1

    const x = Math.max(0, Math.min(1, note.bend.value / 8000))
    const ix = 1 - x
    const controls = [
      1,
      x * 0.3 + ix * 0.5,
      x * -0.3 + ix * 1,
      x * -1 + ix * 0.5,
      x * -0.3 + ix * 1,
      x * 0.3 + ix * -1,
      1
    ]
    const step = note.position * (controls.length - 1)
    const a = controls[Math.floor(step)]
    const b = controls[Math.floor(step) + 1]
    const y = 1 - Math.cos((step % 1) * 2 * Math.PI) * 0.5 + 0.5
    return (b * y + a * (1 - y)) * note.pressure.value / 127

    // return (Math.sin(note.position * 2 * Math.PI) * 2 - 1) * note.pressure.value / 127
  }

  process (input, outputs, parameters) {
    const output = outputs[0]
    for (let channelIndex = 0; channelIndex < output.length; ++channelIndex) {
      const buffer = output[channelIndex]
      for (let i = 0; i < buffer.length; ++i) {
        let sum = 0
        this.calculateNotes(1 / sampleRate)
        for (const id in this.notesByInput) {
          const notes = this.notesByInput[id] ||= []
          notes.forEach(note => {
            sum += this.play(note)
          })
        }
        buffer[i] = sum
      }
    }
    return true
  }
};

registerProcessor('bezier-tone-generator', BezierToneGenerator)
