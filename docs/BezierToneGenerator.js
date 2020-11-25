/* eslint-env browser */
/* global sampleRate */

class BezierToneGenerator extends AudioWorkletProcessor {
  constructor () {
    super()
    this.positions = {}
    this.controlData = {}
    function setControlData (data, ...path) {
      getControl(...path).data = data
    }
    function getControl (...path) {
      let current = path
      path.forEach(step => {
        current = current[step] = current[step] || {}
      })
      return current
    }
    this.port.onmessage = e => {
      console.log(e.data)
    }
  }

  static get parameterDescriptors () {
    return [
      { name: 'pressure', defaultValue: 0 }
    ]
  }

  getPosition (channelIndex, note) {
    const channel = this.positions[channelIndex] = this.positions[channelIndex] || {}
    const position = channel[note] = channel[note] || 0
    return position
  }

  setPosition (channelIndex, note, position) {
    const channel = this.positions[channelIndex] = this.positions[channelIndex] || {}
    channel[note] = position
    return position
  }

  process (input, outputs, parameters) {
    const output = outputs[0]
    for (let channelIndex = 0; channelIndex < output.length; ++channelIndex) {
      const buffer = output[channelIndex]
      for (let i = 0; i < buffer.length; ++i) {
        let position = this.getPosition(channelIndex, 0)
        position = (position + 440 / sampleRate) % 1
        this.setPosition(channelIndex, 0, position)
        buffer[i] = 0.2 * (Math.cos(position * 2 * Math.PI) * 2 - 1) * parameters.pressure
      }
    }
    return true
  }
};

registerProcessor('bezier-tone-generator', BezierToneGenerator)
