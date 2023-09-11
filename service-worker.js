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
    switch(message.action) {
        case 'getProjects':
            const [cookieErr, cookie] = await retrieveCookie();
            if(cookieErr) return;
            
            const { tab } = sender;
            tabPort = chrome.tabs.connect(tab.id, { name: `liveSEO-extension-tab${tab.id}` });

            try {
                const projects = await retrieveProjects(cookie)

                tabPort.postMessage({
                    action: message.action,
                    data: projects
                });
                //displayIconColor(tab.id);
            } catch (error) {
                tabPort.postMessage({ action: 'error' });
                //displayIconPb(tab.id);
            }
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




function displayIconColor(tabId){
    let icon_path = {
        path: {
            16: '/icons/icon_16.png',
            32: '/icons/icon_32.png',
            32: '/icons/icon_48.png',
            128: '/icons/icon_128.png'
        }
    }
    
    if(tabId){
        icon_path.tabId = tabId;
    }
    chrome.action.setIcon(icon_path, null)
}

