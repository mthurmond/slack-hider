//store slack's "no new messages" favicon by loading the image from the .crx file using the chrome extension API's ".getURL" method. 
const noMessageFavicon = chrome.extension.getURL('/hider/favicon-no-messages.png');

//create flag to control whether messages sidebar should be hidden. set value to true and remove initial toggleMessages function call to show messages by default. set to false and include an initial toggleMessages call to hide messages by default.
let showMessages = false;

//declare toggle button variable. needs to be global because it's used in multiple functions. 
let messageToggleButton;

// declare mutation observer variables. they're each only used in a single function but the value needs to be tracked over time. 
let titleObserver;
let faviconObserver;

// add style for badges that appear in search results so, later, the display property can be toggled based on whether messages are visible.
const badgeStyleElement = document.createElement('style');
badgeStyleElement.id = 'hider__slack-badge';
document.body.appendChild(badgeStyleElement);

const workspaceOpacityStyle = document.createElement('style');
workspaceOpacityStyle.id = 'hider__slack-workspace--opaque';
document.body.appendChild(workspaceOpacityStyle);

const workspaceHoverStyle = document.createElement('style');
workspaceHoverStyle.id = 'hider__slack-workspace--hover';
document.body.appendChild(workspaceHoverStyle);

const skinBackground = document.createElement('style');
skinBackground.id = 'hider__slack-skin--background';
document.body.appendChild(skinBackground);

const skinHover = document.createElement('style');
skinHover.id = 'hider__slack-skin--hover';
document.body.appendChild(skinHover);

function getSidebar() {
    return document.getElementsByClassName('p-channel_sidebar__list')[0];
}

//add button to DOM that hides messages
function addToggleButton() {
    messageToggleButton = document.createElement('button');

    messageToggleButton.innerHTML = showMessages ? 'Hide messages' : 'Show messages';

    //add an id from the hider.css file and a native slack class 
    messageToggleButton.id = 'hider__message-toggle-button';
    messageToggleButton.classList.add('c-button-unstyled');

    //add listener that calls "toggleMessages" when button clicked, and passes opposite of current "showMessages" boolean value. "showMessages" is set to 'false' initially, so this initially passes 'true'.
    messageToggleButton.addEventListener('click', function (evt) {
        toggleMessages(!showMessages);
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

        //set mutation observer that swaps the "no message" favicon back in if it's ever changed while messages are hidden. have to observe the "head" element because slack swaps out the full favicon element whenever the favicon needs to be changed. 
        faviconObserver = new MutationObserver(function(mutations) {
            if (!showMessages && document.querySelector('link[rel*="icon"]').href != noMessageFavicon) {
                document.querySelector('link[rel*="icon"]').href = noMessageFavicon;
            } 
        });

        faviconObserver.observe(
            document.querySelector('head'),
            {subtree: true, characterData: true, childList: true, attributes: true}
        );

    }
}

function swapTitle(showDefaultTitle) {

    if (showDefaultTitle) {

        document.title = 'Slack';

        //remove the mutation observer
        titleObserver.disconnect();

    } else {

        document.title = 'Messages hidden';

        //activate the mutation observer
        titleObserver = new MutationObserver(function(mutations) {
            if (!showMessages && document.title != 'Messages hidden') {
                document.title = 'Messages hidden';
            } 
        });

        titleObserver.observe(
            document.querySelector('title'),
            { characterData: true, childList: true }
        );

    }
}

//called when show/hide button clicked, with current "showMessages" boolean value. clicking the button adjusts the sidebar visibility and button text.  
function toggleMessages(areMessagesVisible) {
    
    //set sidebar visibility
    const slackChannelSidebar = getSidebar();
    const sidebarVisibility = areMessagesVisible ? 'visible' : 'hidden';
    slackChannelSidebar.style.visibility = sidebarVisibility;

    messageToggleButton.innerHTML = areMessagesVisible ? 'Hide messages' : 'Show messages';

    //set badge element display so mention badges only appear in search results while messages are visible
    const badgeDisplay = areMessagesVisible ? 'inline-block' : 'none';
    badgeStyleElement.innerHTML = `.c-mention_badge { display: ${badgeDisplay}; }`

    if (areMessagesVisible) {
        workspaceOpacityStyle.innerHTML = '';
        workspaceHoverStyle.innerHTML = '';

    } else {
        workspaceOpacityStyle.innerHTML = '.p-workspace__primary_view, .p-workspace__secondary_view { opacity: 0.2; transition: opacity 1.0s; }';

        workspaceHoverStyle.innerHTML = '.p-workspace__primary_view:hover, .p-workspace__secondary_view:hover, .p-workspace__primary_view:hover ~ .p-workspace__secondary_view { opacity: 1.0; transition: opacity 1.0s; }';
    }

    if (areMessagesVisible) {
        skinBackground.innerHTML = '';
        skinHover.innerHTML = '';
    } else {
        skinBackground.innerHTML = '.p-top_nav, .p-ia__sidebar_header, .p-channel_sidebar, .p-top_nav__search { background-color: black; transition: background-color 2.0s }';
        skinHover.innerHTML = '.p-ia__sidebar_header--top-nav:not(.p-ia__sidebar_header--creator-setup):hover, .p-top_nav__search:hover { background-color: #171617; transition: none; }';
    }

    //swap favicon each time button pressed
    swapFavicon(areMessagesVisible);

    //swap title each time button pressed
    swapTitle(areMessagesVisible)

    //set showMessages equal to its new, opposite value since areMessagesVisible was set to "!showMessages" in the click event handler. the new value must be stored in this global variable so it persists in the browser's memory, gets attached to the 'window' object, and has the correct updated value next time the button is clicked.
    showMessages = areMessagesVisible;
}

//once the required elements exist, this function initiates the slack hider
function initiateSlackHider() {
    addToggleButton();
    
    //call this to hide messages by default when slack is first loaded
    toggleMessages(showMessages);
}

//continuously check if the required elements exist. once they do, stop checking and call the appropriate function. 
const checkForElements = setInterval(function () {
    if (
        document.getElementsByClassName('p-channel_sidebar__list').length > 0 
        && document.querySelector('link[rel*="icon"]').href.length > 0 
        && document.title.length > 0
    ) {
        clearInterval(checkForElements);
        initiateSlackHider();
    }
}, 100);