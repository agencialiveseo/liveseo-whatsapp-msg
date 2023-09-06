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
    }
});

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (message) => {
        const [cookieErr, cookie] = await retrieveCookie();
        if(cookieErr) {
            port.postMessage({ action: 'error' })
            console.log(cookie)
            return;
        };
        
        const [validationErr, validation] = await validateLogin(cookie);
        if(validationErr) { 
            port.postMessage({ action: 'error' })
            return;
        };
    });
});

async function retrieveCookie() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({ url: appUrl, name: 'connect.sid' }, (cookie) => {
            if (!cookie) reject([true, null]);

            resolve([null, cookie]);
        });
    });
}


async function validateLogin(cookie) {
    try {
        const response = await fetch(`${apiUrl}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
        });
        if (response.ok) {
            const data = await response.text();
            return [null, data];
        } else {
            return [true, null]
        }
    } catch (error) {
        return [error, null]
    }
}

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
