/* eslint-env browser */
/* global sampleRate */

class BezierToneGenerator extends AudioWorkletProcessor {
  constructor () {
    super()
    this.notesByInput = {}
    this.port.onmessage = e => this.handleMessage(e)
  }

  handleMessage (e) {
    const { name, value } = e.data
    switch (name) {
      case 'notes':
        return this.handleNotes(value)
      case 'waveforms':
        return this.handleWaveforms(value)
    }
  }

  handleNotes (notesByInput) {
    for (const id in notesByInput) {
      const notes = this.notesByInput[id] ||= []
      const inNotes = notesByInput[id]
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

  handleWaveforms (waveforms) {
    this.waveforms = waveforms
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

    if (this.waveforms && this.waveforms[0]) {
      const waveform = this.waveforms[0]
      const x = note.position
      let index = waveform.length - 1
      while (waveform[index].x > x && index) index--
      const left = waveform[index]
      const right = waveform[(index + 1) % waveform.length]
      const dx = ((index === waveform.length - 1) ? 1 : right.x) - left.x
      const third = dx / 3
      const a = left.y
      const b = left.y + left.slope * third
      const c = right.y - right.slope * third
      const d = right.y
      const p = (x - left.x) / dx
      const i = 1 - p
      const v = a * i * i * i + 3 * b * i * i * p + 3 * c * i * p * p + d * p * p * p
      return 0.2 * v * note.pressure.value / 127
    } else {
      return (Math.sin(note.position * 2 * Math.PI) * 2 - 1) * note.pressure.value / 127
    }
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
