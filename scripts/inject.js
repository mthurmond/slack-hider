//ensure the correct document title appears when slack first loads and hides messages. it seems to work in all cases but this one. probably requires updating when the swapTitle function is called, since it's currently being called when the placeholder 'Slack' title has been inserted. might also need to ensure 'title' is set in the initial function call prior to calling toggleMessages. 

//finalize design requirements for toggle button. One idea: add arrow icon to left side of button, change text to "All messages", and have arrow point down or to the right based on whether messages are shown or not. 

//make default show/hide behavior easier to configure

// publish to chrome webstore
// https://developer.chrome.com/webstore/publish?csw=1

//create variable to store slack's default "no new messages" favicon. have to load the image from the slack hider .crx file using the chrome extension API's ".getURL" method. 
var noMessageFavicon = chrome.extension.getURL("favicon-no-messages.png");

//create flag to control whether messages sidebar should be hidden. set value to true and remove initial toggleMessages function call to show messages by default. set value to false and include an initial toggleMessages call to hide messages by default.
let messageVisibility = false;

let messageToggleButton = '';

//add button to DOM that hides messages
function addToggleButton() {
    messageToggleButton = document.createElement('button');

    // should try to make the default 'Hide messages' and then have the initial code call the 'toggleMessages' function to hide messages
    if (messageVisibility) {
        
        messageToggleButton.innerHTML = 'Show messages';

    } else {

        messageToggleButton.innerHTML = 'Hide messages';

    }
    
    //apply css created in inject.css file, and a native slack css class 
    messageToggleButton.classList.add('message-toggle-button', 'c-button-unstyled');

    //adds 'click' event listener to button which calls "toggleMessages" function when button clicked, and passes opposite of current "messageVisibility" boolean value. "messageVisibility" is set to 'false' initially, so this initially passes 'true'.
    messageToggleButton.addEventListener('click', function (evt) {
        toggleMessages(!messageVisibility);
    });

    //store messages sidebar in a variable
    let slackChannelSidebar = document.getElementsByClassName('p-channel_sidebar__list')[0];

    // insert the messageToggleButton as a sibling node that's just before the sidebar
    slackChannelSidebar.parentNode.insertBefore(messageToggleButton, slackChannelSidebar);

}

function swapFavicon(faviconVisiblity) {
    
    //consider converting this to short form if/then syntax
    if (faviconVisiblity) {

        chrome.storage.sync.get(['value'], function (result) {
            document.querySelector('link[rel*="icon"]').href = result.value;
        }); 

    } else {

        // store link to current favicon and replace link w/ no msg favicon
        let lastFavicon = document.querySelector('link[rel*="icon"]').href;

        chrome.storage.sync.set({ 'value': lastFavicon }, function () {});

        document.querySelector('link[rel*="icon"]').href = noMessageFavicon;

    }
}

function swapTitle(titleVisiblity) {
    
    //consider converting this to short form if/then syntax
    if (titleVisiblity) {
    
        console.log("show branch of swapTitle");

        chrome.storage.sync.get(['titleValue'], function (result) {
            document.title = result.titleValue;
        }); 

    } else {
        
        console.log("hide branch of swapTitle");
        // store current document title
        let lastTitle = document.title;

        chrome.storage.sync.set({ 'titleValue': lastTitle }, function () {
            console.log('titleValue is set to ' + lastTitle);
        });

        document.title = 'Messages hidden';

    }
}

//removes all the injected css rules
function clearInjectedCSS() {
    let injectedNode = document.getElementById('slack-hider-injected');

    if (injectedNode) {
        injectedNode.parentNode.removeChild(injectedNode);
    }
}

//pass a css ruleset, and this appends it to the document body
function injectCSS(str) {
    let nodeToInject = document.createElement('style');
    nodeToInject.setAttribute('id', 'slack-hider-injected');
    nodeToInject.innerHTML = str;
    document.body.appendChild(nodeToInject);
}

//object to store css rulesets that need to be added/removed based on message visibility
selectors = {
    //create rulset to hide the red unread message counter that appears in auto-complete search results
    'New search unread count': function (value) { return `.c-member__unread_count { display: ${value}; }` },
}

//called when show/hide button clicked, with current "messageVisibility" boolean value. clicking the button adjusts the sidebar visibility and button text.   
function toggleMessages(isVisible) {
    let slackChannelSidebar = document.getElementsByClassName('p-channel_sidebar__list')[0];
    //stores appropriate css values for the messaging sidebar's and any other relvant element's visibility and display properties.
    elementVisibility = isVisible ? 'visible' : 'hidden';
    elementDisplay = isVisible ? 'flex' : 'none';

    slackChannelSidebar.style.visibility = elementVisibility;

    messageToggleButton.innerHTML = isVisible ? 'Hide messages' : 'Show messages';

    //each time button pressed, swap favicon
    swapFavicon(isVisible);

    // clear any previous css injected
    clearInjectedCSS();

    //inject a css rulset to show/hide unread message notifications in the slack search results. this is added as a separate css style because the element doesn't exist on the page until the user begins a search, and a separate style over-rides the slack default styling at that time. 
    injectCSS(selectors['New search unread count'](elementDisplay));

    //each time button pressed, swap title. should i only run this function once the page title has been fully set? sometimes it's set to only 'Slack'. 
    swapTitle(isVisible)

    //set messageVisibility equal to it's new, opposite value since isVisible was set to "!messageVisibility" in the click event handler. the new value must be stored in this global variable so it persists in the browser's memory, gets attached to the 'window' object, and so it has the correct updated value next time the button is clicked.
    messageVisibility = isVisible;
}

//first step of program. continuously check if messages sidebar and favicon link exist. if they do, stop checking and call the approrpiate functions.
let checkExists = setInterval(function () {
    if (document.getElementsByClassName('p-channel_sidebar__list').length > 0 && document.querySelector('link[rel*="icon"]').href.length > 0) {
        clearInterval(checkExists);
        addToggleButton();
        //call this to hide messages when slack is first loaded
        toggleMessages(messageVisibility);
    }
}, 100);