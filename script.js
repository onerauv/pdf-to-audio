const pdfInput = document.getElementById('pdfUpload');
const pdfText = document.getElementById('pdfText');
const video = document.getElementById('bgVideo');

let currentUtterance = null;
let currentVolume = 1;
let googleVoice = null;

/* LOAD VOICES */
function loadVoices() {
  const voices = speechSynthesis.getVoices();

  googleVoice = voices.find(v =>
    v.name.toLowerCase().includes("google") &&
    (v.lang === "en-US" || v.lang === "hi-IN")
  ) || voices[0];
}

window.speechSynthesis.onvoiceschanged = loadVoices;

/* TYPE + SPEAK */
async function typeTextWithVoice(text, element, delay = 20) {
  element.textContent = "";
  let index = 0;

  speechSynthesis.cancel();

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = text.match(/[अ-ह]/) ? "hi-IN" : "en-US";
  currentUtterance.volume = currentVolume;
  currentUtterance.rate = 1;
  currentUtterance.pitch = 1;

  if (googleVoice) currentUtterance.voice = googleVoice;

  currentUtterance.onend = () => {
    video.pause();
  };

  speechSynthesis.speak(currentUtterance);

  while (index < text.length) {
    element.textContent += text[index];
    element.scrollTop = element.scrollHeight;
    index++;
    await new Promise(res => setTimeout(res, delay));
  }
}

/* PDF UPLOAD */
pdfInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  video.style.display = 'block';
  video.play();
  pdfText.textContent = "Extracting text...";

  const reader = new FileReader();

  reader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    let textContent = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map(item => item.str).join(' ') + '\n';
    }

    const readableText = textContent.slice(0, 4000) || "No readable text found.";

    await typeTextWithVoice(readableText, pdfText, 20);
  };

  reader.readAsArrayBuffer(file);
});
