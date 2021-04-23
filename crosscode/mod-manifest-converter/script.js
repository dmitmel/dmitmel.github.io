import * as manifestM from './manifest.js';

/** @type {HTMLInputElement} */
let packageJsonInput = document.getElementById('text-package-json');
/** @type {HTMLInputElement} */
let ccmodJsonInput = document.getElementById('text-ccmod-json');
/** @type {HTMLParagraphElement} */
let errorContainer = document.getElementById('error-container');

let validator = new manifestM.Validator();

packageJsonInput.addEventListener('input', () => {
  while (errorContainer.lastChild != null) errorContainer.removeChild(errorContainer.lastChild);

  try {
    let legacyManifest;
    try {
      legacyManifest = JSON.parse(packageJsonInput.value);
    } catch (error) {
      if (error instanceof SyntaxError) {
        let span = document.createElement('span');
        span.classList.add('error');
        span.append('Syntax errors:');
        let ul = document.createElement('ul');
        let li = document.createElement('li');
        li.append(String(error.message));
        ul.append(li);
        errorContainer.append(span, ul);
        return;
      } else {
        throw error;
      }
    }

    let modernManifest;
    try {
      validator.validateLegacy(legacyManifest);
    } catch (error) {
      if (error instanceof manifestM.ManifestValidationError) {
        let span = document.createElement('span');
        span.classList.add('error');
        span.append('Validation errors for package.json:');
        let ul = document.createElement('ul');
        for (let problem of error.problems) {
          let li = document.createElement('li');
          li.append(String(problem));
          ul.append(li);
        }
        errorContainer.append(span, ul);
        return;
      } else {
        throw error;
      }
    }

    modernManifest = manifestM.convertFromLegacy(legacyManifest);

    try {
      validator.validate(modernManifest);
    } catch (error) {
      if (error instanceof manifestM.ManifestValidationError) {
        let span = document.createElement('span');
        span.classList.add('error');
        span.append('Validation errors for ccmod.json:');
        let ul = document.createElement('ul');
        for (let problem of error.problems) {
          let li = document.createElement('li');
          li.append(String(problem));
          ul.append(li);
        }
        errorContainer.append(span, ul);
      } else {
        throw error;
      }
    }

    ccmodJsonInput.value = JSON.stringify(modernManifest, null, 2);

    let span = document.createElement('span');
    span.classList.add('success');
    span.append('Everything is alright!');
    errorContainer.append(span);
    return;
  } catch (error) {
    let span = document.createElement('span');
    span.classList.add('error');
    span.append('Critical error:');
    let ul = document.createElement('ul');
    let li = document.createElement('li');
    li.append(String(error));
    ul.append(li);
    errorContainer.append(span, ul);
    return;
  }
});
