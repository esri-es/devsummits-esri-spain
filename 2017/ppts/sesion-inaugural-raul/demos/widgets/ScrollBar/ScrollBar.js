define([
  "esri/core/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dojo/text!./templates/ScrollBar.html",
  "dojo/_base/lang",
  "esri/core/domUtils",
  "dojo/on",
  "dojo/has",
  "dojo/dom-class"],

  function(declare, WidgetBase, TemplatedMixin, template, lang, domUtils, on, has, domClass) {

    var dojo = window.dojo;

    var mouseEventHandlers = [];
    var forwardMouseEvents = function(from, to, eventType)    {
      mouseEventHandlers.push(on(from, eventType, function(event) {

        event.preventDefault();
        event.stopPropagation();

        var mouseEvent = document.createEvent("MouseEvent");
        mouseEvent.initMouseEvent(
          eventType,
          event.bubbles,
          event.cancelable,
          window,
          event.detail,
          event.screenX,
          event.screenY,
          event.clientX,
          event.clientY,
          event.ctrlKey,
          event.altKey,
          event.shiftKey,
          event.metaKey,
          event.button,
          event.relatedTarget
        );
        // fix for scroll wheel
        if (event.wheelDelta) {
          mouseEvent.wheelDelta = event.wheelDelta;
        }

        to.dispatchEvent(mouseEvent);

      }));
    };

    var scrollEventHandler = function(event) {
      event.stopPropagation();
      var touches = event.changedTouches, first = touches[0], type = "";
      if (event.touches.length > 1) {
        return;
      }
      switch (event.type) {
      case "touchstart":
        type = "mousedown";
        break;
      case "touchmove":
        type = "mousemove";
        break;
      case "touchend":
        type = "mouseup";
        var simulatedClickEvent = document.createEvent("MouseEvent");
        simulatedClickEvent.initMouseEvent("click", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY,
            false, false, false, false, 0/* left */, null);
        first.target.dispatchEvent(simulatedClickEvent);
        event.preventDefault();
        break;
      default:
        return;
      }

      var simulatedEvent = document.createEvent("MouseEvent");
      simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false,
        false, false, false, 0/* left */, null);
      first.target.dispatchEvent(simulatedEvent);
      event.preventDefault();
    };

    var stopEventPropagationFunc = function(event) {
      if (event) {
        event.stopPropagation();
      }
      return false;
    };

    var ScrollBar = declare([WidgetBase, TemplatedMixin], {
      templateString: template,
      scrollTarget: undefined,
      view: undefined,
      _onHandles: undefined,

      constructor: function(params, SrcRef) {
        this._onHandles = [];
      },

      destroy: function() {
        this._onHandles.forEach(function(handle) {
          handle.remove();
        });
        mouseEventHandlers.forEach(function(handle) {
          handle.remove();
        });
        if(this._viewPortResize) {
          this._viewPortResize.remove();
        }
        this.scrollTarget.removeEventListener("click", stopEventPropagationFunc, true);
        this.scrollTarget.removeEventListener("mousedown", lang.hitch(this, function() {
          this._stopScrollTargetDragging(event);
        }), true);
        this.scrollTarget.removeEventListener("touchmove", scrollEventHandler, true);
        this.scrollTarget.removeEventListener("touchstart", scrollEventHandler, true);
        this.scrollTarget.removeEventListener("touchend", scrollEventHandler, true);
        this.scrollTarget.removeEventListener("touchcancel", scrollEventHandler, true);
      },

      postCreate: function() {
        this.vertical = false;
        this.PAGE_Y = this.vertical ? "pageY" : "pageX";
        this.DIMENSION = this.vertical ? "height" : "width";
        this.OFFSET_DIMENSION = this.vertical ? "offsetHeight" : "offsetWidth";
        this.TOP = this.vertical ? "top" : "left";
        if (domClass.contains(dojo.doc.body.parentNode, "esriRtl")) {
          this.TOP = this.vertical ? "top" : "right";
        }
        this.wheelDir = this.vertical ? -1 : 1;
        this.relativeSliderPosition =  0;
        this.state  = 0;
        this.mousePosRelativeToHandle = 0;
        this.min = 0;
        this.max = 1;
        this.easing = 0;
        this.originMousePos = 0;

        this._updatePosition(this.relativeSliderPosition, true);

        this._viewPortResize = this.view.on("resize", lang.hitch(this, function() {
          this._updatePosition(this.relativeSliderPosition, true);
          this.updateWidth();
        }));

        this._setupEventHandlers();
      },

      _startScrollTargetDragging: function(event) {
        // disable stop click propagation - in case there is no mouse move
        this.scrollTarget.removeEventListener("click", stopEventPropagationFunc, true);

        document.addEventListener("mouseup", lang.hitch(this, function(event) {
          this._stopScrollTargetDragging(event);
        }), true);

        event = event || window.event;
        event.preventDefault();
        this.originMousePos = event.clientX;
        this.startMouseCoords = {x: 0, y: 0};
        this.startMouseCoords.x = event.clientX;
        this.startMouseCoords.y = event.clientY;

        document.onmousemove = lang.hitch(this, function(event) {

          // disable stop click propagation - we're not yet in drag mode
          this.scrollTarget.removeEventListener("click", stopEventPropagationFunc, true);

          // don't do anything if the move is small
          if (  Math.abs(Math.abs(event.clientX) - Math.abs(this.startMouseCoords.x)) < 3 &&  Math.abs(Math.abs(event.clientY) - Math.abs(this.startMouseCoords.y)) < 1) {
            return;
          }

          // enable stop click propagation - we're in drag mode - no click allowed until we start moving again
          this.scrollTarget.addEventListener("click", stopEventPropagationFunc, true);

          event = event || window.event;
          event.preventDefault();

          // calc variation on the horizontal axis
          var newMousePos = event.clientX;
          var variation = this.originMousePos - newMousePos;
          if (domClass.contains(dojo.doc.body.parentNode, "esriRtl")) {
            variation = -variation;
          }
          // save new position
          this.originMousePos = newMousePos;
          this._updatePosition(this._calcRelativePosition(this._calcPosition(this.relativeSliderPosition) + variation));
          return false;
        });
      },

      _stopScrollTargetDragging: function(event) {
        document.onmousemove = function() {};
        event.preventDefault();
      },

      _setupEventHandlers: function() {
        var h1 = on(this.scrollBarSpace, "click", lang.hitch(this, function(event) {
          event.preventDefault();
          this.updateWidth();
          this._updatePosition((event[this.PAGE_Y] - this.scrollBarContainer.getBoundingClientRect()[this.TOP]) / this._getDimension());
          event.stopPropagation();
        }));
        this._onHandles.push(h1);

        var h2 = on(this.scrollTarget, ((has("mozilla") === undefined) ? "mousewheel" : "DOMMouseScroll"), lang.hitch(this, function(event) {
          event.preventDefault();
          event.stopPropagation();
          var wheelPos = (has("mozilla") === undefined) ? event.wheelDelta : event.detail * (-60);
          this._updatePosition((this._getAbsoluteDimension() - wheelPos / (12 * this.wheelDir)) / this._getTrackDimension());
        }));
        this._onHandles.push(h2);

        var h3 = on(this.scrollBarHandleHitArea, "mousedown", lang.hitch(this, function(event) {
          event.preventDefault();
          event.stopPropagation();
          if (event.which == 1) {
            this.state = 1;
            if (domClass.contains(dojo.doc.body.parentNode, "esriRtl")) {
              this.mousePosRelativeToHandle = Math.min(this.scrollBarHandleHitArea[this.OFFSET_DIMENSION], Math.max(0, -event[this.PAGE_Y] + this.scrollBarHandleHitArea.getClientRects()[0][this.TOP]));
            }
            else {
              this.mousePosRelativeToHandle = Math.min(this.scrollBarHandleHitArea[this.OFFSET_DIMENSION], Math.max(0, event[this.PAGE_Y] - this.scrollBarHandleHitArea.getClientRects()[0][this.TOP]));
            }
          }
        }));
        this._onHandles.push(h3);

        var h4 = on(document, "mousemove", lang.hitch(this, function(event) {

          if (this.state == 1) {
            event.preventDefault();
            if (domClass.contains(dojo.doc.body.parentNode, "esriRtl")) {
              this._updatePosition((this.scrollBarContainer.getBoundingClientRect()[this.TOP] - event[this.PAGE_Y] - this.mousePosRelativeToHandle) / this._getTrackDimension());
            }
            else{
              this._updatePosition((event[this.PAGE_Y] - this.scrollBarContainer.getBoundingClientRect()[this.TOP] - this.mousePosRelativeToHandle) / this._getTrackDimension());
            }
          }
        }));
        this._onHandles.push(h4);

        var h5 = on(document, "mouseup", lang.hitch(this, function(event) {
          if (this.state == 1) {
            event.preventDefault();
            this.state = 0;
          }
        }));
        this._onHandles.push(h5);

        // forward scroll wheel events from scrollbar to scroll target
        forwardMouseEvents(this.scrollBarContainer, this.scrollTarget, (has("mozilla") === undefined) ? "mousewheel" : "DOMMouseScroll");
      },

      _calcRelativePosition: function(position) {
        var availableAmountToScroll =  this.scrollTarget.scrollWidth - this.scrollTarget.offsetWidth;
        return position / availableAmountToScroll;
      },

      _calcPosition: function(rel) {
        var availableAmountToScroll =  this.scrollTarget.scrollWidth - this.scrollTarget.offsetWidth;
        return rel * availableAmountToScroll;
      },

      _getDimension: function() {
        return this.scrollBarContainer[this.OFFSET_DIMENSION];
      },

      _getTrackDimension: function() {
        return this.scrollBarHandleContainer[this.OFFSET_DIMENSION];
      },

      _getAbsoluteDimension: function() {
        return Math.round(this._getTrackDimension() * this.relativeSliderPosition);
      },

      _updatePosition: function(sliderRel_, noScroll, doAnimation) {
        this.relativeSliderPosition = Math.min(Math.max(sliderRel_, 0.001), 0.999);
        this.scrollBarHandleHitArea.style[this.TOP] = (this._getAbsoluteDimension() - this.scrollBarHandleHitArea[this.OFFSET_DIMENSION] / 2) + "px";
        if (!noScroll) {
          this._scrollTo(this.relativeSliderPosition);
        }
      },

      _scrollTo: function (pos) {
        var availableAmountToScroll =  this.scrollTarget.scrollWidth - this.scrollTarget.offsetWidth;
        var newVal = Math.ceil( pos * availableAmountToScroll );
        newVal = newVal <= availableAmountToScroll  ? newVal : availableAmountToScroll;
        newVal = newVal > 0 ? newVal : 0;
        if (domClass.contains(dojo.doc.body.parentNode, "esriRtl")) {
          // RTL scrollleft is implemented differently in firefox, ie and chrome(safari) :(
          if (has("mozilla")) {
            newVal = -newVal;
          }
          else if(has("chrome") || has("safari")) {
            newVal = availableAmountToScroll - newVal;
          }
        }
        this.scrollTarget.scrollLeft = newVal;
      },

      setRange: function(min_, max_) {
        this.min = min_;
        this.max = max_;
      },

      get: function() {
        return this.relativeSliderPosition;
      },

      set: function(relPos, noScroll) {
        if (this.state === 0) {
          this.updatePos(relPos, noScroll);
        }
      },

      setInRange: function(pos) {
        var relPos = (pos - this.min) / (this.max - this.min);
        this.set(relPos);
      },

      enableScrollTargetDrag: function () {

        if ( this.scrollTarget ) {
          this.scrollTarget.addEventListener("mousedown", lang.hitch(this, function(event) {
            this._startScrollTargetDragging(event);
          }), true);
          // translate touch events into click
          this.scrollTarget.addEventListener("touchmove", scrollEventHandler, true);
          this.scrollTarget.addEventListener("touchstart", scrollEventHandler, true);
          this.scrollTarget.addEventListener("touchend", scrollEventHandler, true);
          this.scrollTarget.addEventListener("touchcancel", scrollEventHandler, true);
        }

      },

      disableScrollTargetDrag: function() {
        if ( this.scrollTarget ) {
          this.scrollTarget.removeEventListener("mousedown", lang.hitch(this, function(event) {
            this._stopScrollTargetDragging(event);
          }), true);
          this.scrollTarget.removeEventListener("touchmove", scrollEventHandler, true);
          this.scrollTarget.removeEventListener("touchstart", scrollEventHandler, true);
          this.scrollTarget.removeEventListener("touchend", scrollEventHandler, true);
          this.scrollTarget.removeEventListener("touchcancel", scrollEventHandler, true);
        }
      },

      resize: function () {
        this.scrollBarHandleContainer.style[this.DIMENSION] = this._getDimension() + "px";
        this.scrollBarSpace.style[this.DIMENSION] = this._getDimension() + "px";
        if (this.scrollBarHandleHitArea.getClientRects()[0]) {
          this.scrollBarHandleContainer.style[this.DIMENSION] = (this._getDimension() - this.scrollBarHandleHitArea.getClientRects()[0][this.DIMENSION]) + "px";
        }
        this._updatePosition(this.relativeSliderPosition);
      },

      updateWidth: function() {
        var availableAmountToScroll = this.scrollTarget.scrollWidth - this.scrollTarget.offsetWidth;
        // update the handle width
        var minHandleWidth = this.scrollTarget.offsetWidth * 0.2; // 20% of the container
        var maxHandleWidth = this.scrollTarget.offsetWidth * 0.5; // 50% of the container

        var newHandleWidth = Math.max(Math.min(this.scrollTarget.offsetWidth - availableAmountToScroll, maxHandleWidth), minHandleWidth);
        this.scrollBarHandleHitArea.style.width = newHandleWidth + "px";

        if ( 16 >  this.scrollTarget.scrollWidth - this.scrollTarget.offsetWidth ) {
          domUtils.hide(this.scrollBarHandleHitArea);
        }
        else {
          domUtils.show(this.scrollBarHandleHitArea);
        }
        this.resize();
      }

    });
    return ScrollBar;
  });
