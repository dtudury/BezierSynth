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
    console.log(JSON.stringify(waveforms, null, ' . '))
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
    /*
    const i = Math.max(0, Math.min(1, note.bend.value / 8000))

    function calculatePoint (controls, position) {
      const step = position * (controls.length - 1)
      const p0 = controls[Math.floor(step)]
      const p1 = controls[Math.floor(step) + 1]
      const i = Math.cos((step % 1) * 2 * Math.PI) * 0.5 + 0.5
      return p1 * i + p0 * (1 - i)
    }
    const a = [
      1, 0.5, 0.75, 0, -1, -0.75, -1, -0.6, -0.8, -1, 0.75, 0.5, 1
    ]
    const b = [
      1, -1, 1
    ]
    const ap = calculatePoint(a, note.position)
    const bp = calculatePoint(b, note.position)
    return (ap * i + bp * (1 - i)) * note.pressure.value / 127
    */

    if (this.waveforms && this.waveforms[0]) {
      const waveform = this.waveforms[0]
      const waveformPosition = note.position * waveform.length
      const step = Math.floor(waveformPosition)
      const p = waveformPosition % 1
      const i = 1 - p
      const left = waveform[(step + waveform.length - 1) % waveform.length]
      const right = waveform[(step + waveform.length) % waveform.length]
      const a = left[2].y
      const b = right[0].y
      const c = right[1].y
      const d = right[2].y
      return 0.2 * (a * i * i * i + 3 * b * i * i * p + 3 * c * i * p * p + d * p * p * p) * note.pressure.value / 127
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
        if (Math.random() * 10000 < 1) {
          console.log(buffer[i])
        }
      }
    }
    return true
  }
};

registerProcessor('bezier-tone-generator', BezierToneGenerator)
