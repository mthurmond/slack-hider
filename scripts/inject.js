//create variable containing the favicon 'no messages' image
//this refers to the image using base64 encoding. cleaner way is to load it in the extension directory, add it as a web accessible resource, and refer to it using the chrome.runtime.getURL method.
//reference: https://developer.chrome.com/extensions/content_scripts
let noMessageFavicon = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAzFBMVEVKFEyScpNLFU1cK16Mao1hMmOEX4WObZBWJFiQb5FZKFtNGE97VH1QHFJOGVBsQW5jNWV2TXdsQG1aKVxdLV9WI1dwRXGObI9pPGpTIFVPG1FfL2FSH1RVIld8VX1YJlpOGlBbK12RcZJMFk5iNGSBW4JmOGhgMGF3TniLaIx9Vn5lN2eFYYaNa45eLmB5UXtkN2ZUIVaGYodkNmVtQm9YJ1pRHVOHZImCXIN1THZgMWKDXoR9V392TniMaY1nOmmKZ4tpPWtXJVlvRHFqMc1IAAABCklEQVR4Xr3RxZLEIBSG0f9C3NPuPu7u/v7vNEE6dFdRM7s+i0sFvg0EO9X0/CQFeqfeCWwyh4gmCKgSwGJOlRCuWG5gMSKBrcTch03jvwD9Z9eFNcj4gcRj1EE2H5n7OaS93+lA7uXQPKo96kDt9aH4JnDUNS+xEEsLSmKCC0zFMoWY3RmUdBKSFCYDoHPmNCCCaw6DSTC2v8bnw+E9llHrCkBUHkvJbbz1hC4Tl+khWtDaHrQjGXAxH1CSEWwGzUJMH09ktKHkRPTCdBCEdfCKteItj6EDjDuHUvnBsKkO7EywIvr8+juofMNCnnTVUsCird6Gq99o80PkRFh6VcZgFafyYDDDbv0CWLgS6JWTyyIAAAAASUVORK5CYII="

//create button that hides messages
let show_hide_button = document.createElement('button');
show_hide_button.innerHTML = 'Show messages';
//apply css created in inject.css file, and a native slack css class 
show_hide_button.classList.add('show-hide-button', 'c-button-unstyled');

//create flag to control whether messages sidebar should be hidden
let hidden = true;

function clear_injected_css() {
    let existing_node = document.getElementById('slack-hider-injected');

    if (existing_node) {
        existing_node.parentNode.removeChild(existing_node);
    }
}

//add a style to the document body when called. 
function inject_css(str) {
    let node = document.createElement('style');
    node.setAttribute('id', 'slack-hider-injected');
    node.innerHTML = str;
    document.body.appendChild(node);
}

//figure out what type of js syntax this is. it acts like a switch statement and can be called like a function.
selectors = {
    'Search unread count': function(value) { return `span.c-search_autocomplete__unread_count { visibility: ${value}; }` },
    'Unread search results header': function(value) { return `div.c-search_autocomplete li[role="presentation"]:first-of-type { display: ${value}; }` },
    'Unread search results': function(value) { return `div.c-search_autocomplete li[role="presentation"]:first-of-type ~ .c-search_autocomplete__suggestion_item { display: ${value}; }` },
    'Other search results': function(value) { return `div.c-search_autocomplete li[role="presentation"]:not(:first-of-type) ~ .c-search_autocomplete__suggestion_item { display: ${value}; }` },
}

//called with current "hidden" boolean value. 
function activate(hide) {
    let sidebar_node = document.getElementsByClassName('p-channel_sidebar__list')[0];
    //stores appropriate values for the messaging sidebars css visibility and display properties based on whether it should be hidden
    target_visibility = hide ? 'hidden' : 'visible';
    target_display = hide ? 'none' : 'flex';

    //applies appropriate css visibility value and button text
    sidebar_node.style.visibility = target_visibility;
    show_hide_button.innerHTML = hide ? 'Show messages' : 'Hide messages';

    //inject css to show/hide unread message notifications in the slack search results 
    clear_injected_css();
    inject_css(selectors['Unread search results header'](target_display));
    inject_css(selectors['Unread search results'](target_display));
    inject_css(selectors['Other search results']('flex'));
    inject_css(selectors['Search unread count'](target_visibility));

    hidden = hide;
}

//store messages sidebar in a variable
function main() {
    let sidebar_node = document.getElementsByClassName('p-channel_sidebar__list')[0];

    //if button is clicked, adds listener to button that calls "activate" function when button is clicked and passes opposite of current "hidden" boolean value
    show_hide_button.addEventListener('click', function(evt) {
        activate(!hidden);
    });

    sidebar_node.parentNode.insertBefore(show_hide_button, sidebar_node);

}

//change slack favicon to the "no unread messages" favicon
window.onload = function() {
 
    setTimeout(function(){ 
 
        document.querySelector('link[rel*="icon"]').href = noMessageFavicon

    }, 3000);

};

show_hide_button.onclick = function() {
    document.querySelector('link[rel*="icon"]').href = noMessageFavicon

};

// first step of js function executions. continuously check if messages sidebar exists. if it does, stop checking and call "main()" function.
let check_exists = setInterval(function() {
    if (document.getElementsByClassName('p-channel_sidebar__list').length > 0) {
        clearInterval(check_exists);
        main();
    }
}, 100);