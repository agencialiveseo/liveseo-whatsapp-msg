'use strict';
//------------------------------************************----------------------
//------------------------------URLS------------------------------------------
let tabPort;
// Verificar se há algum ambiente salvo no Local Storage
let savedEnvironment = "PROD";
chrome.storage.local.get("environment", (result) => {
    if(!result.environment) {
        chrome.storage.local.set({ environment: 'PROD' });
        savedEnvironment = 'PROD';
    } else {
        savedEnvironment = result.environment;
    }
});


// Definir o ambiente padrão como PROD caso não haja ambiente salvo
let environment = savedEnvironment;
let environmentMap = {
    LOCAL: {
        app: 'http://localhost:3000',
        api: 'http://localhost:3010'
    },
    QA: {
        app: 'https://qa.app.liveseo.com.br',
        api: 'https://qa.app.liveseo.com.br/v2'
    },
    PROD: {
        app: 'https://app.liveseo.com.br',
        api: 'https://app.liveseo.com.br/v2'
    },
};

// Atualizar as URLs da aplicação e da API de acordo com o ambiente
let appUrl = environmentMap[environment].app;
let apiUrl = environmentMap[environment].api;

let count = 0;
let counterTimeout;

// Registre o atalho de teclado para alternar o ambiente
chrome.commands.onCommand.addListener(function(command) {
    if (command === "toggle-environment") {
        count++
        if(count <= 5){
            if(counterTimeout) clearTimeout(counterTimeout)            
            counterTimeout = setTimeout(() => count = 0, 10000);
            return; 
        } 
        // Alternar entre os ambientes da API
        if (environment === "LOCAL") {
            environment = "QA";
        } else if (environment === "QA") {
            environment = "PROD";
        } else if (environment === "PROD") {
            environment = "LOCAL";
        }

        // Atualizar as URLs da aplicação e da API
        appUrl = environmentMap[environment].app;
        apiUrl = environmentMap[environment].api;

        // Salvar o ambiente no Local Storage
        chrome.storage.local.set({ environment: environment });
        console.log(environment)
    }
});


let connCookie = null;


//------------------------------************************----------------------
//------------------------------LISTENER CONTENT------------------------------
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const { tab } = sender;
    tabPort = chrome.tabs.connect(tab.id, { name: `liveSEO-whatsapp-msg${tab.id}` });
    const [cookieErr, cookie] = await retrieveCookie();
    if(cookieErr) return;

    switch(message.action) {
        case 'getProjects':
            try {
                const projects = await retrieveProjects(cookie)
                tabPort.postMessage({
                    action: message.action,
                    data: projects
                });
            } catch (error) {
                tabPort.postMessage({ action: 'error' });
            }
            break;
        case 'createTask':
            console.log(message.data)
            for(let i in message.data.messages) {
                if(message.data.messages[i].messageImage){
                    let imageBuffer = await fetchAndConvertToArrayBuffer(message.data.messages[i].messageImage)
                    message.data.messages[i].messageImageBuffer = imageBuffer
                }
            }   
            
            let data
            try {
                const response = await fetch(`${apiUrl}/extension-task-generator`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': cookie,
                    },
                    body: JSON.stringify(message.data)
                });
                data = await response.json();
                if(data.error) throw new Error(data.error)
            } catch (error) {
                console.log(error)
            } finally {
                tabPort.postMessage({
                    action: message.action,
                    data: data
                });
            }
            break;
    }
    return;
}); 


async function retrieveProjects(cookie) {
    try {
        const response = await fetch(`${apiUrl}/projects/list?resume=1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
        });
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Failed to retrieve projects');
    }
}

async function retrieveCookie() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({ url: appUrl, name: 'connect.sid' }, (cookie) => {
            if (!cookie) reject([true, null]);

            resolve([null, cookie]);
        });
    });
}

async function fetchAndConvertToArrayBuffer(imageSrc) {
	debugger
	try {
	  const response = await fetch(imageSrc);
	  if (!response.ok) {
		throw new Error(`Erro ao buscar a imagem: ${response.statusText}`);
	  }
  
	  const blob = await response.blob();
	  return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
		  const arrayBuffer = reader.result; // Extrai a parte em base64
		  resolve(arrayBuffer);
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(blob);
	  });
	} catch (error) {
	  console.error('Erro ao buscar e converter a imagem:', error);
	  throw error;
	}
  }