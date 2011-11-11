//
// super-small utility class to abstract away the cross-platform differences between event handling mechanisms
//
// by Ryan Corradini (http://buyog.com)
// last update 8 Nov 2011
// MIT license
//

window.events = {
    'attach': function event_attach(node, eventName, callback) {
        if (node.addEventListener) {
            node.addEventListener(eventName, callback, false);
        } else if (node.attachEvent){
            node.attachEvent('on'+eventName, callback);
        } else {
            return;
        }
    },
    'registry': []
}
