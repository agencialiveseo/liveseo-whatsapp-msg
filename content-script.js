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
};

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
};

/**
 * Cria um elemento de ação 'Enviar para o app' e configura seu comportamento.
 * @returns {HTMLElement} - O elemento HTML criado com o texto 'Enviar para o app' e funcionalidade de clique.
 */
function createSendToApp() {
	const newAction = document.createElement('span')
	newAction.textContent = 'Enviar para o app'
	newAction.id = 'send-to-app'
	newAction.style.cssText = 'cursor: pointer; margin: 1rem;'
	newAction.addEventListener('click', startSendMessagesToApp)
	return newAction
};

let actions = {};

function sendActionAsync(action, data) {
    return new Promise(resolve => {
        sendAction(action, data, resolve);
    })
};

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
};

chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener(message => {
        if(message.action && actions[message.action]){
            actions[message.action].callback(message.data);
            actions[message.action].destroy();
            return;
        }

    })
});

let projects = [];

const serviceResponsible = [
	{value: null , text: 'Responsável'},	
	{value: '#atendimento', text: '#atendimento'},
	{value: '#spaceship', text:'#spaceship'}
];

const requestType = [
	{value: null , text: 'Tipo do atendimento'},
	{value: '#incidente', text: '#incidente'},
	{value: '#duvida', text: '#duvida'},
	{value: '#solicitacao', text: '#solicitacao'},
	{value: '#aviso', text: '#aviso'}
];

const frequencyType =[
	{value: null , text: 'Frequência'},
	{value: '#recorrente', text: '#recorrente'},
	{value: '#esporadicos', text: '#esporadicos'}
]

let selectedMessages = [];
let groupTitle = ''

waitElementOnScreen(
	'#main', 
	async () => {
		let loadedProjects = await sendActionAsync("getProjects");
		loadedProjects.forEach(project => projects.push({value: project.id, text: project.name, code: project.code}))
		projects = projects.sort((a, b) => a.text.localeCompare(b.text))
		projects.unshift({value: null, text: 'Selecione o projeto'})
		let newDialog = createDialog()
		document.getElementById('app').appendChild(newDialog)
		observeDOM(document.getElementById('app'), () => addMenuOnFooter(document.getElementById('main')))}
);

//////////////////////////////////////////////////
////Funções de criação do modal e suas funções////
//////////////////////////////////////////////////

function createDialog() {
	const dialog = document.createElement('dialog')
	dialog.addEventListener('keydown', event => getKeyEvent(event))
	dialog.id = 'myDialog'
	dialog.appendChild(createDialogHeader())
	dialog.appendChild(createDialogBody())
	dialog.appendChild(createDialogFooter())
	return dialog
};

function createDialogHeader() {
	const header = document.createElement('header')
	header.id = 'myDialog-header'
	header.textContent = 'Mensagens selecionadas - ' + getGroupTitle()
	return header
};

function createDialogBody() {
	const body = document.createElement('div')
	body.id = 'myDialog-body'
	body.appendChild(createTitleInput())
	body.appendChild(createDialogSelect(projects, body, 'project-select', 'Projeto'))
	body.appendChild(createDialogSelect(serviceResponsible, body, 'service-select', 'Setor responsável'))
	body.appendChild(createDialogSelect(requestType, body, 'request-select', 'Tipo de atendimento'))
	body.appendChild(createDialogSelect(frequencyType, body, 'frequency-select', 'Frequencia'))
	const messagesContainer = document.createElement('div')
	messagesContainer.id = 'myDialog-messages'
	body.appendChild(messagesContainer)
	return body
};

function createDialogFooter() {
	const footer = document.createElement('footer')
	footer.id = 'myDialog-footer'
	footer.style.cssText = 'margin-top: 1rem; align-self: end;'
	footer.appendChild(createSaveTaskButton())
	footer.appendChild(createCloseDialog())
	return footer
};

function createCloseDialog() {
	const closeButton = document.createElement('button')
	closeButton.id = 'close-button'
	closeButton.textContent = 'Fechar'
	closeButton.addEventListener('click', () => closeMyDialog())
	return closeButton
};

function createSaveTaskButton() {
	const closeButton = document.createElement('button')
	closeButton.id = 'save-button'
	closeButton.style.cssText = 'display:none;'
	closeButton.textContent = 'Criar tarefa'
	closeButton.addEventListener('click', () => createTask())
	return closeButton
};

function createMessages(selectedMessages) {
	var dialog = document.getElementById('myDialog-messages')
	for(let item of selectedMessages) {
		var messageBody = document.createElement('div')
		messageBody.className = 'selected-message'
		var messageOrigin = document.createElement('div')
		var messageText = document.createTextNode(item.messageText)
		messageOrigin.innerHTML = setMessageOrigin(item)
		messageBody.appendChild(messageOrigin)
		messageBody.appendChild(messageText)
		dialog.appendChild(messageBody)
		if(item.messageImage){
			var messageImage = createImageMessage(item.messageImage)
			messageBody.appendChild(messageImage)
		}
	}
};

function setMessageOrigin(item) {
	let text = ''
	if(item.replied){
		if(item.time){
			text = item.replied + ' - ' + item.time + ' - ' + item.contactName + ' - ' + item.contactNumber
		} else {
			text = item.replied + ' - ' + item.contactName + ' - ' + item.contactNumber
		}
	} else {
		text = item.time + ' - ' + item.contactName + ' - ' + item.contactNumber
	}
	return text
}

function createDialogSelect(options, elementId, name) {
	var selectElement = document.createElement("select");
	selectElement.addEventListener("change", () => getSelectedValues())
	selectElement.id = name
	selectElement.style.cssText = "color: #000000; background-color: #ffffff;"
	
	for (var option of options) {
		var optionElement = document.createElement("option");
		optionElement.value = option.value
		optionElement.text = option.text
		selectElement.appendChild(optionElement);
	}
	return selectElement
};

function createTitleInput() {
	var inputElement = document.createElement('input');
	inputElement.addEventListener("input", () => getSelectedValues())
	inputElement.type = 'text';
	inputElement.id = 'task-title-input'
	inputElement.placeholder = 'Título da tarefa';
	inputElement.value = '';
	return inputElement
};

function getKeyEvent(event){
	const key = event.key
	if(key === 'Escape') closeMyDialog()
}

function closeMyDialog() {
	myDialog.close()
	var dialog = document.getElementById('myDialog')
	dialog.remove()
	selectedMessages = []
	let newDialog = createDialog()
	document.getElementById('app').appendChild(newDialog)
};

async function createTask() {
	createLoaderClass()
	changeButtonToLoader()
	let taskData = getSelectedValues()
	let createdTask = await sendActionAsync("createTask", taskData);
	if(createdTask === 'success') {
		let sendToApp = document.getElementById('send-to-app')
		sendToApp.removeEventListener('click', startSendMessagesToApp)
		sendToApp.innerText = 'Tarefa enviada para o App!'
	} else {
		let sendToApp = document.getElementById('send-to-app')
		sendToApp.removeEventListener('click', startSendMessagesToApp)
		sendToApp.innerText = 'Erro na criação da tarefa!'
	}
	closeMyDialog()
};

////////////////////////////
//mensagens selecionadas://
///////////////////////////
  
async function startSendMessagesToApp() {
	
    let itens = document.querySelectorAll("div[role='application'] div[role='row']")
    let selected = [];
    itens.forEach(function(item){
        let ckbox = item.querySelector("input[type='checkbox']:checked");
        if(!ckbox) return;
        selected.push(item)
    })
  
    for(let i in selected){
		let message = selected[i].querySelector('.copyable-text')
		let {time, replied, contactName, contactNumber, messageText, messageImage} = ''
		if(message){
			let quoted = selected[i].getElementsByClassName('quoted-mention')
			if(quoted.length){
				let quotedMessage = message.firstChild.innerText.split('\n')
				contactName = quotedMessage[0]
				time = ''
				quotedMessage.length > 2 ? contactNumber = quotedMessage[1] : contactNumber = ''
				quotedMessage.length > 2 ? messageText = quotedMessage[2] : messageText = quotedMessage[1]
				replied = 'Mensagem anterior' 
				selectedMessages.push({time, replied, contactName, contactNumber, messageText})
				time = getTime(message)
				replied = 'Resposta'
				contactName = getContactName(selected[i])
				contactNumber = getContactNumber(selected[i])
				messageText = getMessageText(message)
				messageImage = await getImages(selected[i])
			} else {
				time = getTime(message)
				replied = ''
				contactName = getContactName(selected[i])
				contactNumber = getContactNumber(selected[i])
				messageText = getMessageText(message)
				messageImage = await getImages(selected[i])
			}
		} else {
			let imageValues = getValuesForImageMessage(selected[i]);
			time = imageValues.time
			replied = ''
			contactName = imageValues.name
			contactNumber = imageValues.contact
			messageText = ''
			messageImage = await getImages(selected[i])
		}
		selectedMessages.push({time, replied, contactName, contactNumber, messageText, messageImage})
    }

    createMessages(selectedMessages)
	let projectGroup = verifyProject(groupTitle)
	if(projectGroup) {
		let selectedProject = projects.find(project => project.code === projectGroup)
		var selectProjectElement = document.getElementById("project-select");
		selectProjectElement.value = selectedProject.value
	}
    myDialog.showModal()
  };

  function createImageMessage(imgSrc) {
	let imageElement = document.createElement('img')
	imageElement.src = imgSrc
	imageElement.style.cssText = "width: 50%; margin: 1rem 1rem 0;"
	return imageElement
  }


  async function getImages(selectedMessage) {
	const messageImgs = selectedMessage.querySelectorAll("img");
	if (messageImgs.length) {
		let trueImg = null;
		for (const el of messageImgs) {
		if (el.src.startsWith('blob:')) {
			trueImg = el.src;
			break; 
		}
		}
		return trueImg
	}
	return false;
  };

  function getValuesForImageMessage(selectedMessage) {
	let message = selectedMessage.innerText
	let values = message.split('\n')
	if(values.length < 3){
		while(values.length < 3){
			values.push('')
		}
	}
	return {name: values[0], contact: values[1], time: values[2]}
  }

//////////////////////////////////////////////////
//Funções para catpturar os valores selecionadas//
//////////////////////////////////////////////////
function getTime(selectedMessage) {
	const time = selectedMessage.getAttribute("data-pre-plain-text").replace(/\[(.*), (.*)\] .*: /, "$2 $1");
	return time
}

function getMessageText(selectedMessage) {
	const messageText = selectedMessage.querySelector(".selectable-text").textContent;
	return messageText
}

function getContactName(selectedMessage) {
	let contactName = selectedMessage.textContent.match(/(.*?)\+55/)
	if(!contactName){
		let message = selectedMessage.querySelector('.copyable-text')
		contactName = message.getAttribute("data-pre-plain-text").replace(/\[.*\] (.*): /, "$1");
	} else {
		contactName = contactName[1]
	}
	return contactName
}
function getContactNumber(selectedMessage) {
	let element = selectedMessage.firstChild.getAttribute('data-id')
	let values = element.split('_')
	const contactNumber = values[values.length -1].replace('@c.us', '')
	return contactNumber
}


function getGroupTitle(){
	const main = document.getElementById('main')
	const header = main.getElementsByTagName('header')
	groupTitle = header[0].querySelector('div:nth-child(2) > div > div > span').innerText
	return groupTitle
};

function getSelectedValues() {
	var inputElement = document.getElementById("task-title-input");
	var inputValue = inputElement.value;

	var selectProjectElement = document.getElementById("project-select");
	var selectedProjectOption = selectProjectElement.options[selectProjectElement.selectedIndex];
	var selectedProject = selectedProjectOption.value;

	var project = projects.find(el => el.value == selectedProject)
	if(project){
		var projectName = project.text
	}

	var selectedService = getSelectdOption("service-select");
	var selectedRequest = getSelectdOption("request-select");
	var selectedFrequency = getSelectdOption("frequency-select");

	if(inputValue != '' && 
		selectedProject != 'null' && 
		selectedService != 'null' && 
		selectedRequest != 'null' && 
		selectedFrequency != 'null') {
			let close = document.getElementById('save-button')
			close.style.cssText = 'display: block;'
			return {
				title: inputValue, 
				projectName: projectName, 
				serviceType: selectedService,
				messages: selectedMessages,
				requestType: selectedRequest,
				frequency: selectedFrequency
			}
		} else {
			return false
		}
};

function getSelectdOption(elementId) {
	var selectedElement = document.getElementById(elementId);
	var selectedOption = selectedElement.options[selectedElement.selectedIndex];
	var selectedValue = selectedOption.value;
	return selectedValue
}

function verifyProject(groupTitle) {
	const regex = /CB\d+/;
	const match = groupTitle.match(regex);
	if (match) {
	  return match[0];
	} else {
	  return null; // Return null if 'CB' is not found in the string
	}
  }


//fetch image base64
async function fetchAndConvertToBase64(imageSrc) {
	try {
	  const response = await fetch(imageSrc);
	  if (!response.ok) {
		throw new Error(`Erro ao buscar a imagem: ${response.statusText}`);
	  }
  
	  const blob = await response.blob();
	  return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
		  const base64String = reader.result; // Extrai a parte em base64
		  resolve(base64String);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	  });
	} catch (error) {
	  console.error('Erro ao buscar e converter a imagem:', error);
	  throw error;
	}
  }

  async function fetchAndConvertToArrayBuffer(imageSrc) {
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

function createLoaderClass() {
	let style = document.createElement('style')
	let styleText = (`
		.loader {
			border: 5px solid #f3f3f3; /* Light grey */
			border-top: 5px solid #3498db; /* Blue */
			border-radius: 50%;
			width: 12px;
			height: 12px;
			animation: spin 2s linear infinite;
		}
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}`
	)
	style.type = 'text/css'
	style.appendChild(document.createTextNode(styleText))
	let head = document.head || document.getElementsByTagName('head')[0]
	head.appendChild(style)
}

function changeButtonToLoader(){
	let close = document.getElementById('close-button')
	close.style.cssText = 'display:none;'
	let loader = document.createElement('div')
	loader.classList.add('loader')
	let save = document.getElementById('save-button')
	save.innerText = ''
	save.appendChild(loader)
}
  