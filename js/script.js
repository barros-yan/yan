function consultarIMEI() {
  const imei = document.getElementById("imei").value;
  const erro = document.getElementById("error");
  if (!imei) {
    erro.innerHTML =
      '<ion-icon name="warning-outline"></ion-icon> Por favor, insira um número IMEI. <button id="close"><ion-icon name="close-outline"></ion-icon></button>';
    erro.classList.add("erro");
    erro.style.display = "flex";

    document.getElementById("close").addEventListener("click", function() {
        erro.style.display = "none";
      });

    return;
  }

  

  // URL da API com o IMEI inserido
  const url = `https://api-sp.smartgps.com.br/__external/checkimei/${imei}`;

  // Fazendo a requisição GET para a API
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Falha na consulta");
      }
      return response.json();
    })
    .then((data) => {
      // Verificando a chave 'existingServers'
      const existingServers = data.existingServers;

      if (existingServers && existingServers.length > 0) {
        // Se existir pelo menos um servidor, exibe os servidores
        document.getElementById("result").style.display="flex";
        document.getElementById("result").innerHTML = `
                  <span class="title-result">Servidores encontrados:</span><br>
                  ${existingServers.join("<br>")}
              `;
              document.getElementById("result").classList.add('success');
      } else {
        // Caso contrário, exibe mensagem de nenhum servidor encontrado
        document.getElementById("result").style.display = "flex";
        document.getElementById("result").textContent =
          "Nenhum servidor encontrado para este IMEI.";
      }
    })
    .catch((error) => {
      document.getElementById("result").textContent = `Erro: ${error.message}`;
    });
}


const icone = document.getElementById("iconeTema");
const trocaTema = document.getElementById("trocaTema");
const container = document.getElementById("containerPrincipal");
const titulo = document.getElementById("titulo");
const imei = document.getElementById("imei");
const result = document.getElementById("result");

const elementosParaAlterarTema = [trocaTema, container, titulo, imei, result];

function alternarTema(elemento) {
  elemento.classList.toggle("temaBranco");
}

function alternarIcone() {
  icone.name = (icone.name === "sunny-outline") ? "moon-outline" : "sunny-outline";
}

trocaTema.addEventListener("click", function() {
  alternarIcone();  // Alterna o ícone

  // Alterna a classe 'temaBranco' nos elementos
  elementosParaAlterarTema.forEach(alternarTema);
});
