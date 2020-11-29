//create variable containing the favicon 'no messages' image
//this refers to the image using base64 encoding. cleaner way is to load it in the extension directory, add it as a web accessible resource, and refer to it using the chrome.runtime.getURL method.
//reference: https://developer.chrome.com/extensions/content_scripts
// https://developer.chrome.com/extensions/manifest/web_accessible_resources
// sidebar, load favicon from image file, not base 64 encoding
let noMessageFavicon = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAzFBMVEVKFEyScpNLFU1cK16Mao1hMmOEX4WObZBWJFiQb5FZKFtNGE97VH1QHFJOGVBsQW5jNWV2TXdsQG1aKVxdLV9WI1dwRXGObI9pPGpTIFVPG1FfL2FSH1RVIld8VX1YJlpOGlBbK12RcZJMFk5iNGSBW4JmOGhgMGF3TniLaIx9Vn5lN2eFYYaNa45eLmB5UXtkN2ZUIVaGYodkNmVtQm9YJ1pRHVOHZImCXIN1THZgMWKDXoR9V392TniMaY1nOmmKZ4tpPWtXJVlvRHFqMc1IAAABCklEQVR4Xr3RxZLEIBSG0f9C3NPuPu7u/v7vNEE6dFdRM7s+i0sFvg0EO9X0/CQFeqfeCWwyh4gmCKgSwGJOlRCuWG5gMSKBrcTch03jvwD9Z9eFNcj4gcRj1EE2H5n7OaS93+lA7uXQPKo96kDt9aH4JnDUNS+xEEsLSmKCC0zFMoWY3RmUdBKSFCYDoHPmNCCCaw6DSTC2v8bnw+E9llHrCkBUHkvJbbz1hC4Tl+khWtDaHrQjGXAxH1CSEWwGzUJMH09ktKHkRPTCdBCEdfCKteItj6EDjDuHUvnBsKkO7EywIvr8+juofMNCnnTVUsCird6Gq99o80PkRFh6VcZgFafyYDDDbv0CWLgS6JWTyyIAAAAASUVORK5CYII="

// trying to load image from chrome extension .crx file
// var imgURL = chrome.runtime.getURL("icons/favicon-no-messages.png");
// var imgURL = chrome.extension.getURL("favicon-no-messages.png");

//create flag to control whether messages sidebar should be hidden
let hidden = true;

let show_hide_button = '';

//add button to DOM that hides messages
function add_show_hide_button() {
    show_hide_button = document.createElement('button');

    // should try to make the default 'Hide messages' and then have the initial code call the 'activate' function to hide messages
    show_hide_button.innerHTML = 'Show messages';
    //apply css created in inject.css file, and a native slack css class 
    show_hide_button.classList.add('show-hide-button', 'c-button-unstyled');

    //adds 'click' event listener to button which calls "activate" function when button clicked, and passes opposite of current "hidden" boolean value. "hidden" is set to 'true' initially, so this initially passes 'false'.
    show_hide_button.addEventListener('click', function (evt) {
        activate(!hidden);
    });

    //store messages sidebar in a variable
    let sidebar_node = document.getElementsByClassName('p-channel_sidebar__list')[0];

    // insert the show_hide_button as a sibling node that's just before the sidebar
    sidebar_node.parentNode.insertBefore(show_hide_button, sidebar_node);

}

//removes all the injected css rules. it doesn't seem to be looping through and clearing all of them.
function clear_injected_css() {
    let existing_node = document.getElementById('slack-hider-injected');

    if (existing_node) {
        existing_node.parentNode.removeChild(existing_node);
    }
}

function swap_favicon(hiddenFavicon) {
    
    if (hiddenFavicon) {
    
        console.log("hide branch of swap favicon if/then");
        // store link to current favicon and replace link w/ no msg favicon
        let lastFavicon = document.querySelector('link[rel*="icon"]').href;

        chrome.storage.sync.set({ 'value': lastFavicon }, function () {
            console.log('Value is set to ' + lastFavicon);
        });

        document.querySelector('link[rel*="icon"]').href = noMessageFavicon;

    } else {
        console.log("show branch of swap favicon if/then");

        chrome.storage.sync.get(['value'], function (result) {
            document.querySelector('link[rel*="icon"]').href = result.value;
        }); 

    }
}

//add a style to the document body when called. 
function inject_css(str) {
    let node = document.createElement('style');
    node.setAttribute('id', 'slack-hider-injected');
    node.innerHTML = str;
    document.body.appendChild(node);
}

//create object that creates the appropriate css selectors to show/hide  store selector properties
selectors = {
    'Search unread count': function (value) { return `span.c-search_autocomplete__unread_count { visibility: ${value}; }` },
    'Unread search results header': function (value) { return `div.c-search_autocomplete li[role="presentation"]:first-of-type { display: ${value}; }` },
    'Unread search results': function (value) { return `div.c-search_autocomplete li[role="presentation"]:first-of-type ~ .c-search_autocomplete__suggestion_item { display: ${value}; }` },
    'Other search results': function (value) { return `div.c-search_autocomplete li[role="presentation"]:not(:first-of-type) ~ .c-search_autocomplete__suggestion_item { display: ${value}; }` },
}

//called when show/hide button clicked, with current "hidden" boolean value. clicking the button adjusts the sidebar visibility, button text. function isn't run on initial slack load, only when button first clicked.  
function activate(hide) {
    console.log("activate called");
    let sidebar_node = document.getElementsByClassName('p-channel_sidebar__list')[0];
    //stores appropriate values for the messaging sidebars css visibility and display properties based on whether it should be hidden
    target_visibility = hide ? 'hidden' : 'visible';
    target_display = hide ? 'none' : 'flex';

    //applies appropriate css visibility value and button text
    sidebar_node.style.visibility = target_visibility;
    show_hide_button.innerHTML = hide ? 'Show messages' : 'Hide messages';

    //calls function that clears css that was previously injected.
    clear_injected_css();

    //inject css to show/hide unread message notifications in the slack search results
    //i think these css rules are created and appeneded to the doc to override any other rules that occur when you trigger the slack search, which then adds the html elements and css classes dynamically. so you can't just change these elements like the ones above, i.e. the sidebar and button, because these elements likely don't exist on the page when the user clicks the show/hide button.
    inject_css(selectors['Unread search results header'](target_display));
    inject_css(selectors['Unread search results'](target_display));
    inject_css(selectors['Other search results']('flex'));
    inject_css(selectors['Search unread count'](target_visibility));

    // each time button pressed, run favicon function
    swap_favicon(hide);

    hidden = hide;
}

// first step of js function executions. continuously check if messages sidebar and favicon link exist. if they do, stop checking and call "main()" function.
let check_exists = setInterval(function () {
    if (document.getElementsByClassName('p-channel_sidebar__list').length > 0 && document.querySelector('link[rel*="icon"]').href.length > 0) {
        clearInterval(check_exists);
        add_show_hide_button();
        swap_favicon(hidden);
    }
}, 100);