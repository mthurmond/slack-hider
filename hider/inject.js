// v1
//the red favicon is appearing sometimes when messages hidden. 
//slack will swap out the node anytime a msg is received and the favicon href changes. and my mutation observer is not being called when the fav node is removed and another one added (or somehow my connecting and disconnecting the node messes this up). can test further with my new slack hider test workspace.
//basically i need the observer to trigger the callback if the node is removed or swapped, then i need it to find the new node, and update the href value for that one. but it needs to do that once the new node has been swapped in. 
//first thing to do is try my new mutation observer at bottom and see if that works
//if not, can also try set interval function i created for same purpose

//remove the other permission google mentioned in their email.

//finalize design requirements for toggle button. One idea: add arrow icon to left side of button, change text to "All messages", and have arrow point down or to the right based on whether messages are shown or not. 

//publish to chrome webstore
//https://developer.chrome.com/webstore/publish?csw=1

//v2
//see if i can get mutation observers to only run on the first mutation, not after the callback changes the title/favicon

//convert all js functions to arrow syntax

//make default show/hide behavior easier to configure

// --->

//store slack's "no new messages" favicon by loading the image from the .crx file using the chrome extension API's ".getURL" method. 
let noMessageFavicon = chrome.extension.getURL("/hider/favicon-no-messages.png");

//create flag to control whether messages sidebar should be hidden. set value to true and remove initial toggleMessages function call to show messages by default. set to false and include an initial toggleMessages call to hide messages by default.
let messageVisibility = false;

//declare toggle button variable. needs to be global because it's used in multiple functions. 
let messageToggleButton;

// declare mutation observer variables. they're each only used in a single function but the value needs to be tracked over time. 
let titleObserver;
let faviconObserver;

//add button to DOM that hides messages
function addToggleButton() {
    messageToggleButton = document.createElement('button');

    messageToggleButton.innerHTML = messageVisibility ? 'Hide messages' : 'Show messages';

    //append an inject.css file class and a native slack class 
    messageToggleButton.classList.add('message-toggle-button', 'c-button-unstyled');

    //add listener that calls "toggleMessages" when button clicked, and passes opposite of current "messageVisibility" boolean value. "messageVisibility" is set to 'false' initially, so this initially passes 'true'.
    //should i store the event/function below in a variable? it appears as anoynmous in the call stack.
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

        chrome.storage.sync.get(['faviconValue'], function (result) {
            document.querySelector('link[rel*="icon"]').href = result.value;
        });

        //disconnect mutation observer so it doesn't require constant favicon checks when messages aren't hidden
        // faviconObserver.disconnect();

    } else {

        // store link to current favicon then replace it with the no msg favicon
        let lastFavicon = document.querySelector('link[rel*="icon"]').href;

        chrome.storage.sync.set({ 'faviconValue': lastFavicon }, function () { });

        document.querySelector('link[rel*="icon"]').href = noMessageFavicon;

        // //set mutation observer that swaps the "no message" favicon back in if it's ever changed while messages are hidden
        // faviconObserver = new MutationObserver(function(mutations) {
        //     if (!messageVisibility && document.querySelector('link[rel*="icon"]').href != noMessageFavicon) {
        //         document.querySelector('link[rel*="icon"]').href = noMessageFavicon;
        //     } 
        // });

        // faviconObserver.observe(
        //     document.querySelector('link[rel*="icon"]'),
        //     {subtree: true, characterData: true, childList: true, attributes: true}
        //     // {subtree: false, characterData: false, childList: false, attributeFilter: [ "href" ]}
        // );

    }
}

function swapTitle(titleVisiblity) {

    if (titleVisiblity) {

        //may need to remove this if i think edge case will happen often where they search for and change to a new channel. to solve for this, could just insert a generic "Slack" title.
        chrome.storage.sync.get(['titleValue'], function (result) {
            document.title = result.titleValue;
        });

        //remove the mutation observer
        titleObserver.disconnect();

    } else {
        
        // store current document title
        let lastTitle = document.title;

        chrome.storage.sync.set({ 'titleValue': lastTitle }, function () {});

        document.title = 'Messages hidden';

        //activate the mutation observer
        titleObserver = new MutationObserver(function(mutations) {
            if (!messageVisibility && document.title != "Messages hidden") {
                document.title = "Messages hidden";
                console.log("title element has been changed to --> " + document.title);
            } 
        });

        //think i can set subtree to false and this will work fine. not sure why i need the other two attributes as true either. maybe characterData, but prob not any child nodes of 'title' node. 
        // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe
        titleObserver.observe(
            document.querySelector('title'),
            { subtree: true, characterData: true, childList: true }
        );

    }
}

//removes all the injected css rules. used arrow function syntax.
let clearInjectedCSS = () => {
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
    
    //store the appropriate visibility and display css values
    let elementVisibility = isVisible ? 'visible' : 'hidden';
    let elementDisplay = isVisible ? 'flex' : 'none';

    slackChannelSidebar.style.visibility = elementVisibility;

    messageToggleButton.innerHTML = isVisible ? 'Hide messages' : 'Show messages';

    //swap favicon each time button pressed
    swapFavicon(isVisible);

    // clear any css injected previously
    clearInjectedCSS();

    //inject a css rulset to show/hide unread message notifications in the slack search results. it's added as a separate css style because the element doesn't exist on the page until the user begins a search, and the separate style over-rides the slack default styling at that time. 
    injectCSS(selectors['New search unread count'](elementDisplay));

    //each time button pressed, swap title. should i only run this function once the page title has been fully set? sometimes it's set to only 'Slack'. 
    swapTitle(isVisible)

    //set messageVisibility equal to its new, opposite value since isVisible was set to "!messageVisibility" in the click event handler. the new value must be stored in this global variable so it persists in the browser's memory, gets attached to the 'window' object, and so it has the correct updated value next time the button is clicked.
    messageVisibility = isVisible;
}

//not currently in use
function faviconObserverFunc() {

    faviconObserver = new MutationObserver(function(mutations) {
        if (!messageVisibility && document.querySelector('link[rel*="icon"]').href != noMessageFavicon) {
            document.querySelector('link[rel*="icon"]').href = noMessageFavicon;
        } 
    });

    faviconObserver.observe(document.querySelector('link[rel*="icon"]'), {subtree: true, characterData: true, childList: true, attributes: true});
        // is this next line correct? seems i should observe the full node, not just the property
        // google whether or not mutation observers can be called when node is removed or swapped. i could also set this on the parent and somehow observe the child favicon node(s)
        // but first step is to try to get it to observe the full node and see if it's called when i slack self a message. then i can check if the new node is swapped in in time for the new fav link to be applied
        // {subtree: false, characterData: false, childList: false, attributeFilter: [ "href" ]}

}

//first step of program. continuously check if messages sidebar and favicon link exist. if they do, stop checking and call the approrpiate functions.
let checkExists = setInterval(function () {
    if (
        document.getElementsByClassName('p-channel_sidebar__list').length > 0 
        && document.querySelector('link[rel*="icon"]').href.length > 0 
        && document.title.length > 0
    ) {
        clearInterval(checkExists);
        addToggleButton();
        //call this to hide messages when slack is first loaded
        toggleMessages(messageVisibility);
        //don't use for now
        faviconObserverFunc();
    }
}, 100);

// dynamically checks if favicon is correct by setting an interval. if not, swaps in correct one. 
let checkFavicon = setInterval(function () {
    if (
        //messages are hidden and favicon icon isn't "no messages"
        messageVisibility
        && document.querySelector('link[rel*="icon"]').href != noMessageFavicon
    ) {
        //determine if i still need to clear the interval
        clearInterval(checkExists);
        
        // set favicon to "no messages"
        document.querySelector('link[rel*="icon"]').href = noMessageFavicon
    }
}, 100);

//set mutation observer that swaps the "no message" favicon back in if it's ever changed while messages are hidden