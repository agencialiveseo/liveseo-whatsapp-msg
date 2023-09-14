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

let connCookie = null;


//------------------------------************************----------------------
//------------------------------LISTENER CONTENT------------------------------
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const { tab } = sender;
    tabPort = chrome.tabs.connect(tab.id, { name: `liveSEO-whatsapp-msg${tab.id}` });
    switch(message.action) {
        case 'getProjects':
            const [cookieErr, cookie] = await retrieveCookie();
            if(cookieErr) return;
            
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
            tabPort.postMessage({
                action: message.action,
                data: 'success'
            });
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