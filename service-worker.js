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
    console.log(message, sender, sendResponse);
    switch(message.ation) {
        case 'setupCookie':
            const [cookieErr, cookie] = await retrieveCookie();
            if(cookieErr) return;
            connCookie = cookie.value;
            sendResponse({ cookie: connCookie });
            console.log(connCookie)
            break;

    }

    return;
}); 





/*
chrome.runtime.onConnect.addListener(async function(port) {
    console.assert(port.name === "content-script");
    const [cookieErr, cookie] = await retrieveCookie();
    console.log(cookie)
      // Process the message or send a response if needed
    
  });
*/

// async function retrieveCookie() {
//     return new Promise((resolve, reject) => {
//         chrome.cookies.getAll({}, (cookie) => {
//             if (!cookie) reject([true, null]);

//             resolve([null, cookie]);
//         });
//     });
// }

async function retrieveCookie() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({ url: appUrl, name: 'connect.sid' }, (cookie) => {
            if (!cookie) reject([true, null]);

            resolve([null, cookie]);
        });
    });
}