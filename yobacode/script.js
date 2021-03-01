(() => {
  let yobalib = {
    TROLOLO_EMOTE_STR: '<:trololo:811985940704526337>',
    utf8Encoder: new TextEncoder(),
    utf8Decoder: new TextDecoder(),

    /**
     * @param {string} text
     * @returns {string}
     */
    encode(text) {
      let bytes = this.utf8Encoder.encode(text);
      let encoded = [];
      for (let i = 0, len = bytes.length; i < len; i++) {
        let byte = bytes[i];
        for (let j = 7; j >= 0; j--) {
          encoded.push(((byte >> j) & 1) !== 0 ? this.TROLOLO_EMOTE_STR : '.');
        }
      }
      return encoded.join('');
    },

    /**
     * @param {string} text
     * @returns {string}
     */
    decode(text) {
      const DOT_CHAR_CODE = '.'.charCodeAt(0);
      let bytes = [];
      let byte = 0;
      let j = 0;
      for (let i = 0, len = text.length; i < len; i++) {
        if (text.charCodeAt(i) === DOT_CHAR_CODE) {
          byte <<= 1;
        } else if (text.startsWith(this.TROLOLO_EMOTE_STR, i)) {
          byte <<= 1;
          byte |= 1;
          i += this.TROLOLO_EMOTE_STR.length - 1;
        } else {
          continue;
        }
        j++;
        if (j >= 8) {
          j = 0;
          bytes.push(byte);
          byte = 0;
        }
      }
      return this.utf8Decoder.decode(new Uint8Array(bytes));
    },
  };

  window.yobalib = yobalib;

  /** @type {HTMLInputElement} */
  let decodedInput = document.getElementById('text-decoded');
  /** @type {HTMLInputElement} */
  let encodedInput = document.getElementById('text-encoded');

  let counterUpdateCallbacks = [];
  function updateCounters() {
    for (let cb of counterUpdateCallbacks) cb();
  }

  let allInputs = [decodedInput, encodedInput];
  for (let input of allInputs) {
    if (input.dataset.counterId != null) {
      let counter = document.getElementById(input.dataset.counterId);
      if (counter != null) {
        let maxLength = parseInt(input.dataset.maxRecommendedLength);

        counterUpdateCallbacks.push(function updateCounter() {
          let actualLength = input.value.length;

          let text = actualLength.toString(10);
          if (maxLength != null) {
            text += '/';
            text += maxLength.toString(10);
          }
          counter.textContent = text;

          if (actualLength > maxLength) {
            counter.classList.add('input-counter-limit-exceeded');
          } else {
            counter.classList.remove('input-counter-limit-exceeded');
          }
        });
      }
    }
  }

  decodedInput.addEventListener('input', () => {
    encodedInput.value = yobalib.encode(decodedInput.value);
    updateCounters();
  });

  encodedInput.addEventListener('input', () => {
    decodedInput.value = yobalib.decode(encodedInput.value);
    updateCounters();
  });
})();
