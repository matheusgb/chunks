document.querySelector("#file").addEventListener("change", event => {
  uploadFileChunked(event.target.files[0]);
});

const url = "";
const token = "";

const uploadFileChunked = async (file) => {
  const tamanhoDoChunk = 1024 * 1024 * 10;
  const tamanhoDoArquivo = file.size;
  const nomeDoArquivo = file.name;

  let inicio = 0;
  let offset = 0;

  while (offset < tamanhoDoArquivo) {
    offset = inicio + tamanhoDoChunk;
    const chunk = file.slice(inicio, offset);
    let end = offset < tamanhoDoArquivo ? offset - 1 : tamanhoDoArquivo;
    const range = `bytes ${inicio}-${end}/${tamanhoDoArquivo}`;
    inicio = offset;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Range", range);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    const formPayload = new FormData();
    formPayload.append('file', chunk, nomeDoArquivo);

    await new Promise((resolve, reject) => {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 201) {
            resolve();
          } else if (xhr.status === 202) {
            reject(new Error("Upload concluído."));
          } else {
            reject(new Error("Erro no upload."));
          }
        }
      };

      xhr.onerror = function () {
        console.log("Ocorreu um erro.");
        reject(new Error("Erro no upload."));
      };

      xhr.send(formPayload);
    }).catch(error => {
      if (error.message === "Upload concluído.") {
        return true;
      } else {
        throw error;
      }
    });
  }

  return false;
};