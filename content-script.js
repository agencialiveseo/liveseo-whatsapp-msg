/**
* Aguarda a presença de elementos correspondentes ao seletor especificado na tela
* e executa uma função de retorno quando os elementos estão presentes.
* @param {string} selector - O seletor CSS que identifica os elementos desejados.
* @param {Function} callback - A função de retorno que será executada quando os elementos estiverem presentes.
* @param {number} [interval=200] - O intervalo de tempo (em milissegundos) entre as verificações de presença dos elementos.
* @returns {void}
*/
function waitElementOnScreen(selector, callback, interval = 200) {
  	// Configura um intervalo que verifica a presença dos elementos
  	let ckInterval = setInterval(function() {
    // Verifica se há elementos correspondentes ao seletor na página
    	if (document.querySelectorAll(selector).length > 0) {
    		// Se os elementos estiverem presentes, execute a função de retorno
      		callback();
      		// Limpa o intervalo para parar de verificar a presença dos elementos
    	  	clearInterval(ckInterval);
	    }
	}, interval);
}

/**
 * Função que permite observar mudanças no DOM de um elemento HTML.
 * @param {HTMLElement} obj - O elemento HTML a ser observado quanto a mudanças no DOM.
 * @param {Function} callback - A função de retorno a ser chamada quando ocorrerem mudanças no DOM.
 * @returns {MutationObserver|void} - Retorna um objeto MutationObserver se suportado pelo navegador, 
 * caso contrário, não retorna nada (undefined).
 */
var observeDOM = (function(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    return function( obj, callback ){
			if( !obj || obj.nodeType !== 1 ) return; 
		
			if( MutationObserver ){
				// define a new observer
				var mutationObserver = new MutationObserver(callback)
		
				// have the observer observe for changes in children
				mutationObserver.observe( obj, { childList:true, subtree:true })
				return mutationObserver
			}
			
			// browser support fallback
			else if( window.addEventListener ){
				obj.addEventListener('DOMNodeInserted', callback, false)
				obj.addEventListener('DOMNodeRemoved', callback, false)
			}
    	}
  	}
)();

/**
 * Adiciona um botão Enviar para o app dentro da barra do whatsapp web.
 * @param {HTMLElement} wppMain - O elemento HTML ao qual o menu será adicionado no rodapé.
 * @returns {void}
 */
function addMenuOnFooter(wppMain) {
	if(wppMain && !wppMain.querySelector('footer').childNodes.length ){
		
		const newElement = createSendToApp()

		let mySpan = wppMain.querySelector('footer + span > div > span')
		if(mySpan.nextElementSibling.id == 'send-to-app') return
	
		wppMain.querySelector('footer + span > div').insertBefore(newElement, mySpan.nextSibling)
	}
}

/**
 * Cria um elemento de ação 'Enviar para o app' e configura seu comportamento.
 * @returns {HTMLElement} - O elemento HTML criado com o texto 'Enviar para o app' e funcionalidade de clique.
 */
function createSendToApp() {
	const newAction = document.createElement('span')
	newAction.textContent = 'Enviar para o app'
	newAction.id = 'send-to-app'
	newAction.style.cssText = 'cursor: pointer; margin: 1rem;'
	newAction.addEventListener('click', () => startSendMessagesToApp())
	return newAction
}

let actions = {};

// sendActionAsync("action", {message:1}).then(console.log)
// await sendActionAsync("action");
function sendActionAsync(action, data) {
    return new Promise(resolve => {
        sendAction(action, data, resolve);
    })
}

// sendAction("action", {message:1}, console.log)
// sendAction("action", console.log)
function sendAction(action, data, callback) {
    if(typeof data == 'function'){
        callback = data;
        data = null;
    }

    if(callback){
        // register our callback on actions with our action name
        actions[action] = {
            callback,
            destroy() {
                clearInterval(actions[action].timeout)
                delete actions[action];
            },
            // set timeout for requests
            timeout: setTimeout(() => {
                if(actions[action]){
                    actions[action]({error: "timeout"});
                    delete actions[action];
                }
            }, 60000)
        };
    }

    chrome.runtime.sendMessage(null, {action, data})
}

chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener(message => {
        if(message.action && actions[message.action]){
            actions[message.action].callback(message.data);
            actions[message.action].destroy();
            return;
        }

    })
})

waitElementOnScreen(
	'#main', 
	async () => {
		let newDialog = createDialog()
		let projects = await sendActionAsync("getProjects");

		console.log("awaiter getProjects", projects);
		sendAction("getProjects", (data) => {
		    console.log("meu callback fora do padrão", data)
		});
		document.getElementById('app').appendChild(newDialog)
		observeDOM(document.getElementById('app'), () => addMenuOnFooter(document.getElementById('main')))}
)

const projects = [
	{value: 'a', text: 'projeto a'}, 
	{value: 'b', text: 'projeto b'}, 
	{value: 'c', text: 'projeto c'}
];

const serviceResponsible = [
	{value: '#atendimento', text: '#atendimento'},
	{value: '#spaceship', text:'#spaceship'}
]

//////////////////////////////////////////////////
////Funções de criação do modal e suas funções////
//////////////////////////////////////////////////

function createDialog() {
	const dialog = document.createElement('dialog')
	dialog.id = 'myDialog'
	dialog.appendChild(createDialogHeader())
	dialog.appendChild(createDialogBody())
	dialog.appendChild(createDialogFooter())
	return dialog
}

function createDialogHeader() {
	const header = document.createElement('header')
	header.id = 'myDialog-header'
	header.textContent = 'Mensagens selecionadas'
	return header
}

function createDialogBody() {
	const body = document.createElement('div')
	body.id = 'myDialog-body'
	body.appendChild(createTitleInput())
	body.appendChild(createDialogSelect(projects, body, 'project-select'))
	body.appendChild(createDialogSelect(serviceResponsible, body, 'service-select'))
	return body
}

function createDialogFooter() {
	const footer = document.createElement('footer')
	footer.id = 'myDialog-footer'
	footer.appendChild(createSaveTaskButton())
	footer.appendChild(createCloseDialog())
	return footer
}

function createCloseDialog() {
	const closeButton = document.createElement('button')
	closeButton.id = 'close-button'
	closeButton.textContent = 'Fechar'
	closeButton.addEventListener('click', () => closeMyDialog())
	return closeButton
}

function createSaveTaskButton() {
	const closeButton = document.createElement('button')
	closeButton.id = 'save-button'
	closeButton.textContent = 'Criar tarefa'
	closeButton.addEventListener('click', () => createTask())
	return closeButton
}

function createMessages(selectedMessages) {
	var dialog = document.getElementById('myDialog-body')
	for(let item of selectedMessages) {
		var messageBody = document.createElement('div')
		messageBody.className = 'selected-message'
		var messageOrigin = document.createElement('div')
		var messageText = document.createTextNode(item.messageText)
		messageOrigin.innerHTML = item.time + ' - ' + item.name
		messageBody.appendChild(messageOrigin)
		messageBody.appendChild(messageText)
		dialog.append(messageBody)
	}
}

function createDialogSelect(options, elementId, name) {
	var selectElement = document.createElement("select");
	selectElement.id = name
	// Use o loop for...of para iterar pelo array de opções
	for (var option of options) {
		// Crie um elemento 'option' para cada opção no array
		var optionElement = document.createElement("option");
		optionElement.value = option.value
		optionElement.text = option.text

		// Adicione o elemento 'option' ao elemento 'select'
		selectElement.appendChild(optionElement);
	}
	return selectElement
}

function createTitleInput() {
	var inputElement = document.createElement('input');
	// Set the type attribute to "text"
	inputElement.type = 'text';
	inputElement.id = 'task-title-input'
	// Set a placeholder text
	inputElement.placeholder = 'Título da tarefa';
	// Set an initial value (optional)
	inputElement.value = '';
	return inputElement
}

function closeMyDialog() {
	myDialog.close()
	var dialog = document.getElementById('myDialog')
	dialog.remove()
	let newDialog = createDialog()
	document.getElementById('app').appendChild(newDialog)
}

async function createTask() {
	const values = getSelectedValues()
	alert(values.inputValue)
	let projects = await retrieveProjects()
	// closeMyDialog()
}

///////////////////////////
// mensagens selecionadas:
///////////////////////////
  
function startSendMessagesToApp() {
    let itens = document.querySelectorAll("div[role='application'] div[role='row']")
    let selected = [];
    itens.forEach(function(item){
        let ckbox = item.querySelector("input[type='checkbox']:checked");
        if(!ckbox) return;
        selected.push(item)
    })
  
    let selectedMessages = []
  
    for(let i in selected){
		let message = selected[i].querySelector('.copyable-text')
		let time = message.getAttribute("data-pre-plain-text").replace(/\[(.*), (.*)\] .*: /, "$2 $1");
		let messageText = message.querySelector(".selectable-text").textContent;
		let name = message.getAttribute("data-pre-plain-text").replace(/\[.*\] (.*): /, "$1");
		let img = ''
		// const messageImgs = message.querySelectorAll("img")
		// if(messageImgs.length > 0) {
		//   img = messageImgs[1].getAttribute('src')
		// }
	
		selectedMessages.push({time, name, messageText})
    }
    createMessages(selectedMessages)
    // chrome.runtime.sendMessage('get-project-data', (response) => {
    //   // Got an asynchronous response with the data from the service worker
    //   console.log('received project data', response);
    // });
    // fetchCookie()
    myDialog.showModal()
  }


function getSelectedValues() {
	var inputElement = document.getElementById("task-title-input");
	var inputValue = inputElement.value;

	var selectProjectElement = document.getElementById("project-select");
	var selectedProjectOption = selectProjectElement.options[selectProjectElement.selectedIndex];
	var selectedProject = selectedProjectOption.value;

	var selectServiceElement = document.getElementById("service-select");
	var selectedServiceOption = selectServiceElement.options[selectServiceElement.selectedIndex];
	var selectedService = selectedServiceOption.value;

	return {inputValue, selectedProject, selectedService}
}


function getProjectsFromServer(){
	return new Promise((resolve, reject) => {
		sendAction("getProjects", resolve);
	});
}


function createTaskFromModal(){
	// todo: get all data from modal
	let data = {
		mock: "true"
	}
}

// chrome.runtime.onConnect.addListener(port => {
//   port.onMessage.addListener(message => {
//       console.log(message)
//   })
// })


function fetchCookie() {
	chrome.tabs.query({}, function (tabs) {
		// const activeTab = tabs[0];
		// chrome.cookies.getAll({ url: activeTab.url }, function (cookies) {
		// Process the cookies, maybe find the one you need
		// Here, we are logging all cookies to the console
		console.log(tabs);
		});
	// });
}
