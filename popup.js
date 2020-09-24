let feedbackURL = 'https://bengrosser.com/';
let githubURL = 'https://github.com/';

let removeExtensionURL = 'www.google.com';
let unpinURL = 'www.tesla.com';
let extensionsDetailsURL = 'chrome://extensions/?id=ghbbhaemcgjamohgkapgkdinhgdcpgim';

let manageExtensionsURL = 'chrome://extensions/';

let benURL = 'https://github.com/tavva';
let mattURL = 'https://github.com/mthurmond';

//$(document).ready(function() {

//open the appropriate new tab when the user clicks each link
document.querySelector(".feedbackLink").addEventListener("click", function() {
    chrome.tabs.create({url: feedbackURL})
});

document.querySelector(".githubLink").addEventListener("click", function() {
    chrome.tabs.create({url: githubURL})
});

document.querySelector(".removeExtensionLink").addEventListener("click", function() {
    window.close();
    chrome.management.uninstallSelf({ showConfirmDialog: true });
});

//don't think there's a way to programmatically unpin, but asked on stack overflow
//https://stackoverflow.com/questions/63968728/how-do-i-unpin-my-chrome-extensions-icon-programmatically

document.querySelector(".extensionsDetailsLink").addEventListener("click", function() {
    chrome.tabs.create({url: extensionsDetailsURL})
});

document.querySelector(".manageExtensionsLink").addEventListener("click", function() {
    chrome.tabs.create({url: manageExtensionsURL})
});

document.querySelector(".benLink").addEventListener("click", function() {
    chrome.tabs.create({url: benURL})
});

document.querySelector(".mattLink").addEventListener("click", function() {
    chrome.tabs.create({url: mattURL})
});

