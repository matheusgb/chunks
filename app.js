const UPLOAD_URL = ""; // preencha com o endpoint que recebe os chunks
const AUTH_TOKEN = ""; // preencha se o endpoint exigir Bearer token

const fileInput = document.querySelector("#file");
const progressBar = document.querySelector("#progress");
const status = document.querySelector("#status");

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  progressBar.value = 0;
  status.textContent = "Enviando...";

  try {
    const { chunksSent } = await uploadFileInChunks(file, {
      url: UPLOAD_URL,
      token: AUTH_TOKEN,
      onProgress: (fraction) => {
        progressBar.value = Math.round(fraction * 100);
      },
    });
    status.textContent = `Upload concluído em ${chunksSent} chunk(s).`;
  } catch (error) {
    status.textContent = `Erro: ${error.message}`;
  }
});
