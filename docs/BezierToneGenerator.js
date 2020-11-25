/* eslint-env browser */
/* global sampleRate */

class BezierToneGenerator extends AudioWorkletProcessor {
  constructor () {
    super()
    this.positions = {}
    this.controlData = {}
    function getControl (...path) {
      let current = path
      path.forEach(step => {
        current = current[step] = current[step] || {}
      })
      return current
    }
    function getControlValue (...path) {
      const control = getControl(...path)
      return control.value ?? control.target ?? 0
    }
    function setControlTarget (target, ...path) {
      getControl(...path).target = target
    }
    function advanceControl (dt, ...path) {
      const a = 0.01
      const f = 0.95
      const control = getControl(...path)
      control.dv ??= 0
      if (Math.abs(control.dv) < 0.01 && Math.abs(control.value - control.target) < 0.1) {
        control.dv = 0
        control.value = control.target
        if (control.value === 0) {
          // TODO: cleanup tree
        }
        return control.value
      } else {
        control.dv = (control.dv + (control.target - control.value) * a * dt) * f
        control.value += control.dv * dt
        return control.value
      }
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
