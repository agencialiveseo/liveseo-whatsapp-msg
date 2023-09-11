document.addEventListener("DOMContentLoaded", () => {
    const loginbutton = document.getElementById('login-app-button')
    loginbutton.addEventListener("click", () => {
        chrome.tabs.query({}, function (tabs) {
        // const activeTab = tabs[0];
        // chrome.cookies.getAll({ url: activeTab.url }, function (cookies) {
            // Process the cookies, maybe find the one you need
            // Here, we are logging all cookies to the console
            console.log(tabs);
        })
    })
});

