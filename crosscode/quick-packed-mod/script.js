(() => {
  /** @type {HTMLFormElement} */
  let form = document.getElementById('inputs-container');
  /** @type {HTMLInputElement} */
  let modIdInput = document.getElementById('text-mod-id');
  /** @type {HTMLInputElement} */
  let modVersionInput = document.getElementById('text-mod-ver');
  /** @type {HTMLInputElement} */
  let modTitleInput = document.getElementById('text-mod-human-name');
  /** @type {HTMLInputElement} */
  let modDescriptionInput = document.getElementById('text-mod-description');
  /** @type {HTMLParagraphElement} */
  let modPrestartInput = document.getElementById('text-mod-prestart');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    let modId = modIdInput.value || modIdInput.placeholder || 'test-mod';
    let modVersion = modVersionInput.value || modVersionInput.placeholder || '0.0.0';
    let modTitle = modTitleInput.value || modTitleInput.placeholder || undefined;
    let modDescription = modDescriptionInput.value || modDescriptionInput.placeholder || undefined;
    let modPrestartCode = modPrestartInput.value || modPrestartInput.placeholder;

    let zip = new JSZip();

    function jsonPretty(value) {
      return JSON.stringify(value, null, 2) + '\n';
    }

    zip.file(
      'ccmod.json',
      jsonPretty({
        id: modId,
        version: modVersion,
        title: modTitle,
        description: modDescription,
        prestart: 'prestart.js',
      }),
    );

    zip.file(
      'package.json',
      jsonPretty({
        name: modId,
        version: modVersion,
        ccmodHumanName: modTitle,
        description: modDescription,
        module: true,
        prestart: 'prestart.js',
      }),
    );

    zip.file('prestart.js', modPrestartCode);

    let blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${modId}_v${modVersion}.ccmod`);
  });
})();
