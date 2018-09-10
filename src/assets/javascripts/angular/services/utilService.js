/* eslint wrap-iife: "off" */
'use strict';

angular.module('calcentral.services').service('utilService', function($cacheFactory, $http, $location, $rootScope, $route, $window, calcentralConfig) {
  /**
   * Pass in controller name so we can set active location in menu
   * @param {String} name The name of the controller
   * @return {undefined}
   */
  var changeControllerName = function(name) {
    $rootScope.controllerName = name;
  };

  var checkIsBcourses = function() {
    $rootScope.isBcourses = $route.current.isBcourses;
  };

  var hideOffCanvasMenu = function() {
    $rootScope.offCanvasMenu = {
      show: false
    };
  };

  /**
   * Check whether CalCentral is being loaded within an iframe
   */
  var isInIframe = !!window.parent.frames.length;

  /**
   * Check if browser supports localStorage
   */
  var supportsLocalStorage = (function() {
    try {
      return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
      return false;
    }
  })();

  var redirect = function(page) {
    $location.path('/' + page);
  };

  var redirectToToolbox = function() {
    window.location = '/toolbox';
  };

  var redirectToHome = function() {
    window.location = '/';
  };

  var preventBubble = function($event) {
    // We don't need to do anything when you hit the enter key.
    // In that instance the event will be undefined.
    if (!$event) {
      return;
    }

    $event.stopPropagation();
    // When it's not an anchor tag or within an anchor tag, we also prevent the default event
    if ($event.target.nodeName !== 'A' && $event.target.parentElement.nodeName !== 'A') {
      $event.preventDefault();
    }
  };

  var setTitle = function(title) {
    var providedServices = calcentralConfig.providedServices;
    if (providedServices.indexOf('calcentral') !== -1) {
      $rootScope.title = title + ' | CalCentral';
    } else {
      $rootScope.title = title;
    }
  };

  /**
   * Post a message to the parent
   * @param {String|Object} message Message you want to send over.
   * @return {undefined}
   */
  var iframePostMessage = function(message) {
    if ($window.parent) {
      $window.parent.postMessage(message, '*');
    }
  };

  /**
   * Update the iframe height on a regular basis to avoid embedded scrollbars on
   * bCourses LTI tools. The message is formatted to be received by a listener
   * in Canvas's public/javascripts/tool_inline.js file; unless it exceeds the
   * Canvas 5000px limit, in which case our own listener handles it.
   *
   * See bc-iframe-resize directive for easy application to Canvas embedded LTI Tools
   * @param {Object} alternativeElement DOM element that provides scrollHeight used to resize iframe
   * @return {undefined}
   */
  var iframeUpdateHeight = function(alternativeElement) {
    if (isInIframe) {
      $window.setInterval(function updateHeight() {
        var heightElement = document.body;
        // Use element argument to provide scrollHeight rather than body
        if (alternativeElement !== undefined && alternativeElement[0] !== undefined) {
          heightElement = alternativeElement[0];
        }
        var frameHeight = heightElement.scrollHeight;
        var messageSubject = frameHeight > 5000 ? 'changeParent' : 'lti.frameResize';
        var message = {
          subject: messageSubject,
          height: frameHeight
        };
        iframePostMessage(JSON.stringify(message));
      }, 250);
    }
  };

  /*
   * Send a message triggering the parent page to scroll to the top.
   * Assumes iframe environment only applies to bCourses / Canvas LTI
   */
  var iframeScrollToTop = function() {
    if (isInIframe) {
      iframePostMessage(JSON.stringify({
        subject: 'changeParent',
        scrollToTop: true
      }));
    } else {
      $window.scrollTo(0, 0);
    }
  };

  var iframeParentLocation = function(location) {
    if (isInIframe) {
      iframePostMessage(JSON.stringify({
        subject: 'changeParent',
        parentLocation: location
      }));
    }
  };

  /*
   * Replaces '/' and '%2F' with '_slash_' to appease Apache. See CLC-4279.
   * We can remove this once Apache is updated and allows 'AllowEncodedSlashes NoDecode'
   */
  var encodeSlash = function(string) {
    return string.replace(/\/|%2F/g, '_slash_');
  };

  var printPage = function() {
    $window.print();
  };

  var uidPattern = /^[0-9]{1,10}$/;

  var accessibilityAnnounce = function(message) {
    // Remove existing announcer
    var existingAnnouncer = $window.document.getElementById('cc-sr-announcer');
    if (document.body.contains(existingAnnouncer)) {
      existingAnnouncer.parentNode.removeChild(existingAnnouncer);
    }

    // Add new announcer
    var announcer = $window.document.createElement('div');
    var announcerAlert = $window.document.createElement('p');
    var announcerHeader = $window.document.createElement('h1');
    announcer.setAttribute('id', 'cc-sr-announcer');
    announcer.setAttribute('class', 'cc-visuallyhidden');
    announcerHeader.innerHTML = 'Last Page Update';
    announcerAlert.setAttribute('role', 'alert');
    announcerAlert.setAttribute('aria-live', 'assertive');
    announcerAlert.innerHTML = message;
    announcer.appendChild(announcerHeader);
    announcer.appendChild(announcerAlert);
    $window.document.body.appendChild(announcer);
  };

  // Expose methods
  return {
    accessibilityAnnounce: accessibilityAnnounce,
    changeControllerName: changeControllerName,
    checkIsBcourses: checkIsBcourses,
    encodeSlash: encodeSlash,
    iframeScrollToTop: iframeScrollToTop,
    iframeUpdateHeight: iframeUpdateHeight,
    iframeParentLocation: iframeParentLocation,
    isInIframe: isInIframe,
    hideOffCanvasMenu: hideOffCanvasMenu,
    naturalSort: require('js-natural-sort'),
    preventBubble: preventBubble,
    printPage: printPage,
    redirect: redirect,
    redirectToToolbox: redirectToToolbox,
    redirectToHome: redirectToHome,
    setTitle: setTitle,
    supportsLocalStorage: supportsLocalStorage,
    uidPattern: uidPattern
  };
});
