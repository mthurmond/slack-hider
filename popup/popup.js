let feedbackURL = 'https://github.com/mthurmond/slack-hider/issues';
let githubURL = 'https://github.com/mthurmond/slack-hider';

let extensionsDetailsURL = 'chrome://extensions/?id=ghbbhaemcgjamohgkapgkdinhgdcpgim';

let manageExtensionsURL = 'chrome://extensions/';

let benURL = 'https://github.com/tavva';
let mattURL = 'https://github.com/mthurmond';

let quietSlackURL = 'https://github.com/tavva/quiet-slack';

//open the appropriate new tab when the user clicks each link
document.querySelector(".feedbackLink").addEventListener("click", function() {
    chrome.tabs.create({url: feedbackURL})
});

document.querySelector(".githubLink").addEventListener("click", function() {
    chrome.tabs.create({url: githubURL})
});

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

document.querySelector(".quietSlackLink").addEventListener("click", function() {
    chrome.tabs.create({url: quietSlackURL})
});