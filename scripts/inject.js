//make default show/hide behavior easier to configure
//finalize design requirements for toggle button. One idea: add arrow icon to left side of button, change text to "All messages", and have arrow point down or to the right based on whether messages are shown or not. 
//make final code cleanups. cleanup comments. submit to chrome app store. 
// https://developer.chrome.com/webstore/publish?csw=1

//create variable containing the favicon 'no messages' image
//this refers to the image using base64 encoding. cleaner way is to load it in the extension directory, add it as a web accessible resource, and refer to it using the chrome.runtime.getURL method.
//reference: https://developer.chrome.com/extensions/content_scripts
// https://developer.chrome.com/extensions/manifest/web_accessible_resources
// sidebar, load favicon from image file, not base 64 encoding
let noMessageFavicon = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAzFBMVEVKFEyScpNLFU1cK16Mao1hMmOEX4WObZBWJFiQb5FZKFtNGE97VH1QHFJOGVBsQW5jNWV2TXdsQG1aKVxdLV9WI1dwRXGObI9pPGpTIFVPG1FfL2FSH1RVIld8VX1YJlpOGlBbK12RcZJMFk5iNGSBW4JmOGhgMGF3TniLaIx9Vn5lN2eFYYaNa45eLmB5UXtkN2ZUIVaGYodkNmVtQm9YJ1pRHVOHZImCXIN1THZgMWKDXoR9V392TniMaY1nOmmKZ4tpPWtXJVlvRHFqMc1IAAABCklEQVR4Xr3RxZLEIBSG0f9C3NPuPu7u/v7vNEE6dFdRM7s+i0sFvg0EO9X0/CQFeqfeCWwyh4gmCKgSwGJOlRCuWG5gMSKBrcTch03jvwD9Z9eFNcj4gcRj1EE2H5n7OaS93+lA7uXQPKo96kDt9aH4JnDUNS+xEEsLSmKCC0zFMoWY3RmUdBKSFCYDoHPmNCCCaw6DSTC2v8bnw+E9llHrCkBUHkvJbbz1hC4Tl+khWtDaHrQjGXAxH1CSEWwGzUJMH09ktKHkRPTCdBCEdfCKteItj6EDjDuHUvnBsKkO7EywIvr8+juofMNCnnTVUsCird6Gq99o80PkRFh6VcZgFafyYDDDbv0CWLgS6JWTyyIAAAAASUVORK5CYII="

// trying to load image from chrome extension .crx file
// var imgURL = chrome.runtime.getURL("icons/favicon-no-messages.png");
// var imgURL = chrome.extension.getURL("favicon-no-messages.png");

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
    
    // messageToggleButton.innerHTML = '';
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
    
    if (faviconVisiblity) {
    
        console.log("show branch of swapFavicon");

        chrome.storage.sync.get(['value'], function (result) {
            document.querySelector('link[rel*="icon"]').href = result.value;
        }); 

    } else {

        console.log("hide branch of swapFavicon");
        // store link to current favicon and replace link w/ no msg favicon
        let lastFavicon = document.querySelector('link[rel*="icon"]').href;

        chrome.storage.sync.set({ 'value': lastFavicon }, function () {
            console.log('Value is set to ' + lastFavicon);
        });

        document.querySelector('link[rel*="icon"]').href = noMessageFavicon;

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

//called when show/hide button clicked, with current "messageVisibility" boolean value. clicking the button adjusts the sidebar visibility, button text. function isn't run on initial slack load, only when button first clicked.  
function toggleMessages(isVisible) {
    console.log("toggleMessages called");
    let slackChannelSidebar = document.getElementsByClassName('p-channel_sidebar__list')[0];
    //stores appropriate values for the messaging sidebars css visibility and display properties based on whether it should be hidden
    elementVisibility = isVisible ? 'visible' : 'hidden';
    elementDisplay = isVisible ? 'flex' : 'none';

    //applies appropriate css visibility value and button text
    slackChannelSidebar.style.visibility = elementVisibility;

    messageToggleButton.innerHTML = isVisible ? 'Hide messages' : 'Show messages';

    // each time button pressed, run favicon function
    swapFavicon(isVisible);

    clearInjectedCSS();

    //inject a css rulset to show/hide unread message notifications in the slack search results. this is added as a separate css style because the element doesn't exist on the page until the user begins a search, and a separate style over-rides the other styling at that time. 
    injectCSS(selectors['New search unread count'](elementDisplay));

    //set messageVisibility equal to it's new value, opposite of what it was previously. the value was changed in the toggleMessages function call, but it must be stored in this global variable so it persists the next time the button is clicked.
    //how does this global variable persist without using local storage or anything? i believe it persists because chrome loads inject.js when slack loads, and then stores all global variable values defined in this file, and keeps them updated as the button click event causes the variable value to be over-written.  
    messageVisibility = isVisible;
}

// first step of js function executions. continuously check if messages sidebar and favicon link exist. if they do, stop checking and call "main()" function.
let checkExists = setInterval(function () {
    if (document.getElementsByClassName('p-channel_sidebar__list').length > 0 && document.querySelector('link[rel*="icon"]').href.length > 0) {
        clearInterval(checkExists);
        addToggleButton();
        //call this to hide messages when slack is first loaded
        toggleMessages(messageVisibility);
    }
}, 100);