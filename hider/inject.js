//store slack's "no new messages" favicon by loading the image from the .crx file using the chrome extension API's ".getURL" method. 
const noMessageFavicon = chrome.extension.getURL("/hider/favicon-no-messages.png");

//create flag to control whether messages sidebar should be hidden. set value to true and remove initial toggleMessages function call to show messages by default. set to false and include an initial toggleMessages call to hide messages by default.
let messageVisibility = false;

//declare toggle button variable. needs to be global because it's used in multiple functions. 
let messageToggleButton;

// declare mutation observer variables. they're each only used in a single function but the value needs to be tracked over time. 
let titleObserver;
let faviconObserver;


function getSidebar() {
    return document.getElementsByClassName('p-channel_sidebar__list')[0];
}

//add button to DOM that hides messages
function addToggleButton() {
    messageToggleButton = document.createElement('button');

    messageToggleButton.innerHTML = messageVisibility ? 'Hide messages' : 'Show messages';

    //append a class from the inject.css file, and append a native slack class 
    messageToggleButton.classList.add('message-toggle-button', 'c-button-unstyled');

    //add listener that calls "toggleMessages" when button clicked, and passes opposite of current "messageVisibility" boolean value. "messageVisibility" is set to 'false' initially, so this initially passes 'true'.
    messageToggleButton.addEventListener('click', function (evt) {
        toggleMessages(!messageVisibility);
    });

    //store messages sidebar in a variable
    const slackChannelSidebar = getSidebar();

    // insert the messageToggleButton as a sibling node that's just before the sidebar
    slackChannelSidebar.parentNode.insertBefore(messageToggleButton, slackChannelSidebar);

}

function swapFavicon(showFavicon) {

    if (showFavicon) {

        chrome.storage.sync.get(['faviconValue'], function (result) {
            document.querySelector('link[rel*="icon"]').href = result.faviconValue;
        });

        //disconnect mutation observer when it's not needed
        faviconObserver.disconnect();

    } else {

        // store link to current favicon then replace it with the no msg favicon
        const lastFavicon = document.querySelector('link[rel*="icon"]').href;
        chrome.storage.sync.set({ 'faviconValue': lastFavicon }, function () { });
        document.querySelector('link[rel*="icon"]').href = noMessageFavicon;

        //set mutation observer that swaps the "no message" favicon back in if it's ever changed while messages are hidden. have to observe the "head" element because slack swaps out the  full favicon element whenever the favicon needs to be changed. 
        faviconObserver = new MutationObserver(function(mutations) {
            if (!messageVisibility && document.querySelector('link[rel*="icon"]').href != noMessageFavicon) {
                document.querySelector('link[rel*="icon"]').href = noMessageFavicon;
            } 
        });

        faviconObserver.observe(
            document.querySelector("head"),
            {subtree: true, characterData: true, childList: true, attributes: true}
        );

    }
}

function swapTitle(titleVisiblity) {

    if (titleVisiblity) {

        document.title = 'Slack';

        //remove the mutation observer
        titleObserver.disconnect();

    } else {

        document.title = 'Messages hidden';

        //activate the mutation observer
        titleObserver = new MutationObserver(function(mutations) {
            if (!messageVisibility && document.title != "Messages hidden") {
                document.title = "Messages hidden";
            } 
        });

        titleObserver.observe(
            document.querySelector('title'),
            { characterData: true, childList: true }
        );

    }
}

//remove all injected css rules
const clearInjectedCSS = () => {
    const injectedNode = document.getElementById('slack-hider-injected');

    if (injectedNode) {
        injectedNode.parentNode.removeChild(injectedNode);
    }
}

//pass a css ruleset, and this appends it to the document body
function injectCSS(CSSRule) {
    let nodeToInject = document.createElement('style');
    nodeToInject.setAttribute('id', 'slack-hider-injected');
    nodeToInject.innerHTML = CSSRule;
    document.body.appendChild(nodeToInject);
}

//object to store css rulesets that need to be added/removed based on message visibility
selectors = {
    //create rulsets to hide the unread message badges that appear in slack search results
    'Slack search unread badges - people': function (value) { return `.c-member__unread_count { display: ${value}; }` },
    'Slack search unread badges - channels': function (value) { return `.c-channel_entity__mentions { display: ${value}; }` },
}

//called when show/hide button clicked, with current "messageVisibility" boolean value. clicking the button adjusts the sidebar visibility and button text.  
function toggleMessages(showMessages) {
    const slackChannelSidebar = getSidebar();
    
    //store the appropriate visibility and display css values
    const elementVisibility = showMessages ? 'visible' : 'hidden';
    const elementDisplay = showMessages ? 'flex' : 'none';

    slackChannelSidebar.style.visibility = elementVisibility;

    messageToggleButton.innerHTML = showMessages ? 'Hide messages' : 'Show messages';

    //swap favicon each time button pressed
    swapFavicon(showMessages);

    // clear any css injected previously
    clearInjectedCSS();

    //inject css rulsets to show/hide unread message badges in the slack search results. add as separate css styles because the elements don't exist on the page until the user begins a search, and, even after slack's default settings are applied, these separate styles will over-ride them.
    injectCSS(selectors['Slack search unread badges - people'](elementDisplay));
    injectCSS(selectors['Slack search unread badges - channels'](elementDisplay));

    //each time button pressed, swap title
    swapTitle(showMessages)

    //set messageVisibility equal to its new, opposite value since showMessages was set to "!messageVisibility" in the click event handler. the new value must be stored in this global variable so it persists in the browser's memory, gets attached to the 'window' object, and has the correct updated value next time the button is clicked.
    messageVisibility = showMessages;
}

//continuously check if messages sidebar and favicon link exist. once they do, stop checking and call the appropriate functions. this is the file's initial function call. 
const checkExists = setInterval(function () {
    if (
        document.getElementsByClassName('p-channel_sidebar__list').length > 0 
        && document.querySelector('link[rel*="icon"]').href.length > 0 
        && document.title.length > 0
    ) {
        clearInterval(checkExists);
        addToggleButton();
        //call this to hide messages by default when slack is first loaded
        toggleMessages(messageVisibility);
    }
}, 100);