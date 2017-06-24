define([
  "esri/core/declare",
  "esri/core/watchUtils",
  "esri/core/HandleRegistry",
  "dojo/_base/lang",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/on",
  "dojo/dom",
  "dojo/query",
  "dojo/has",
  "dojo/dom-style",
  "dojo/_base/fx",
  "../ScrollBar/ScrollBar"
], function(
  declare,
  watchUtils, HandleRegistry,
  lang, domClass, domCtr, on, dom, query, has, domStyle, fx,
  ScrollBar
) {

  var SlideDeck = declare(null, {
    name: "SlideDeck",
    baseClass: "SlideDeck",
    appState: null,
    watchHandlers: null,
    currentSlidePlay: null,
    currentSlideIndexPlay: null,
    playing: false,

    constructor: function(options, domNode) {
      this.watchHandlers = new HandleRegistry();
      this.appState = options.appState;
      this.cls = options.class;
      this.mainContainerNode = domNode;
      this.container = domNode;

      domClass.add(domNode, "slideDeck");
      this.slideNodes = [];

      watchUtils.when(options.appState.view, "map", function() {
        this._initialize();
      }.bind(this));
    },

    _initialize: function() {
      this.watchHandlers.removeAll();
      this.webScene = this.appState.view.map;

      var slidesChanged = this._slidesChanged.bind(this);
      var slidesChangedHandle = watchUtils.on(this.appState.view, "map.presentation.slides", "change", slidesChanged, slidesChanged);

      this.watchHandlers.add(slidesChangedHandle, "map");

      if (this.baseClass === "SlideDeck") {
          // observe SlideDeck class changes to detect hide and show
        var observer = new MutationObserver(this._slideContainerAttributeChanged.bind(this));
        var config = {attributes: true, childList: false, characterData: false, attributeFilter: ["class"], attributeOldValue: true};
        observer.observe(this.container, config);
        domStyle.set(this.container, "opacity", "0");

        var initialWaitBeforeShowingSlides = 3000;
        setTimeout(this._fadeSlidesIn.bind(this, true), initialWaitBeforeShowingSlides);
      }
    },

    _slidesChanged: function(param) {
      var isInitialLoad = param && param.declaredClass === "esri.core.Collection<webSceneViewer.webscene.Slide>";
      if (!isInitialLoad) {
        domStyle.set(this.container, "opacity", "");
      }
      this._update();
      this.watchHandlers.remove("slides");
      this.watchHandlers.add(this.webScene.presentation.slides.map(function(slide) {
        return slide.watch(["title", "thumbnail.url"], this._update.bind(this));
      }, this), "slides");
    },

    _updatePlayButton: function(container) {
      this.playButton = domCtr.create("div", {
        "class": "playButton"
      }, container);
      this.playIcon = domCtr.create("button", {
        "class": "playIcon"
      }, this.playButton);

      this.watchHandlers.add(on(this.playButton, "click", function () {
        if (this.playing) {
          this._stopPlay();
        }
        else {
          this._startPlay();
        }
      }.bind(this)));

      this.watchHandlers.add(this.appState.view.watch("interacting", function() {
        this._stopPlay();
      }.bind(this)));
      this.watchHandlers.add(on(document.body, "click", function(event) {
          // stop playing when clicking around in the UI
        if (this.playing) {
          var clickedNode = event.target ? event.target : event.srcElement;
          if (!dom.isDescendant(clickedNode, this.playButton)) {
            this._stopPlay();
          }
        }
      }.bind(this)));
    },

    _startPlay: function() {
      if ((this.currentSlideIndexPlay == null) || (this.currentSlideIndexPlay >= this.webScene.presentation.slides.length)) {
        this.currentSlideIndexPlay = 0;
      }
      if (this.currentSlideIndexPlay < this.webScene.presentation.slides.length) {
        this.playing = true;
        domClass.add(this.playButton, "playing");
        this._play();
      }
    },

    _stopPlay: function() {
      this.playing = false;
      if (this.appState.view.animation) {
        this.appState.view.animation.stop();
      }
      domClass.remove(this.playButton, "playing");
    },

    _play: function() {
      if (!this.playing) {
        this._stopPlay();
        return;
      }
      if ((this.currentSlideIndexPlay >= this.webScene.presentation.slides.length) || (this.currentSlideIndexPlay == null)) {
        this.currentSlideIndexPlay = 0;
      }

      this.currentSlidePlay = this.webScene.presentation.slides.getItemAt(this.currentSlideIndexPlay);
      this.currentSlidePlay.applyTo(this.appState.view).then(function() {
        var slideId = this.mainContainerNode.id + "slideButton" + this.currentSlidePlay.id;
        this._highlightBookmark(slideId);
        setTimeout(function() {
          this.currentSlideIndexPlay++;
          this._play();
        }.bind(this), 2000);
      }.bind(this));
    },

    _update: function() {
      this.slideNodes = [];
      if (this.outerContainer) {
        domCtr.destroy(this.outerContainer);
        this.outerContainer = null;
      }

      if (!this.appState.view.map) {
        return;
      }

      var nrSlides = this.webScene.presentation.slides.length;

      if (nrSlides === 0) {
          // if there are no slides we do not need to show anything
        return;
      }

      this.outerContainer = domCtr.create("div", {
        "class": "Slidebar"
      });

      if (has("enable-feature:slide-play")) {
        domClass.add(this.outerContainer, "usePlayButton");
        this._updatePlayButton(this.outerContainer);
      }

      this.innerContainer = domCtr.create("ul", {
        "class": "slideDeckInner"
      });

      domCtr.place(this.outerContainer, this.mainContainerNode, "first");
      domCtr.place(this.innerContainer, this.outerContainer, "first");

      if (this.cls) {
        domClass.add(this.innerContainer, this.cls);
      }


      for (var slideIdx = 0; slideIdx < nrSlides; slideIdx++) {
        var slide = this.webScene.presentation.slides.getItemAt(slideIdx);
        var slideNode = domCtr.create("li", {
          "class": "slide",
          nr: slideIdx,
          bmid: slide.id
        }, this.innerContainer);
        this.slideNodes.push(slideNode);

        var slideButton = domCtr.create("div", {
          "class": "slideButton",
          id: this.mainContainerNode.id + "slideButton" + slide.id
        }, slideNode);

        domCtr.create("p", {
          "class": "smallTitle",
          innerHTML: slide.title.text,
          title: slide.title.text
        }, slideButton);

          // home icon
        domCtr.create("div", {
          "class": "homeIcon"
        }, slideButton);

        domCtr.create("img", {
          src: slide.thumbnail.url
        }, slideButton);
        this.watchHandlers.add(on(slideButton, "click", lang.partial(function (slide, slideIdx) {
          this.currentSlideIndexPlay = slideIdx;
          slide.applyTo(this.appState.view);
          var slideId = this.mainContainerNode.id + "slideButton" + slide.id;
          this._highlightBookmark(slideId);
          if (this.onSlideChanged) {
            this.onSlideChanged();
          }
        }.bind(this), slide, slideIdx)));
      }
      if (this.name === "SlideDeck") {
        this.horizontalScrollbar = new ScrollBar({scrollTarget: this.innerContainer, view: this.appState.view});
        this.horizontalScrollbar.startup();
        this.horizontalScrollbar.placeAt(this.outerContainer);
        this.horizontalScrollbar.updateWidth();
        this.horizontalScrollbar.enableScrollTargetDrag();
      }
    },

    _clearHighlight: function() {
      query(".slideButton.highlight").forEach(function(node, index, arr) {
        node.className = "slideButton";
      });
    },

    _highlightBookmark: function(slideId) {
      this._clearHighlight();

      var div = dom.byId(slideId);
      if (div) {
        domClass.add(div, "highlight");
      }
    },

    _slideContainerAttributeChanged: function() {
      if (domClass.contains(this.container, "navFadeIn")) {
        this._fadeSlidesIn(false);
      }
    },

    _fadeSlidesIn: function(initialSlowAnimation) {
      if (!this.outerContainer) {
        return;
      }
      if (!initialSlowAnimation) {
        domClass.remove(this.outerContainer, "noBorderAnimation");
      }
      else {
        domClass.add(this.outerContainer, "noBorderAnimation");
        domClass.replace(this.outerContainer, this._getAnimationClassName(), "noBorderAnimation");
          // fade in slide deck on initial load
        fx.fadeIn({
          node: this.container,
          duration: 50
        }).play();
      }
    },

      // animation speed depends on number of slides and is split into 3 css animation classes
      // I wanted to avoid too much js for animations
    _getAnimationClassName: function() {
      var smallNumberOfSlides = 9;
      var mediumNumberOfSlides = 16;
      if (this.slideNodes.length < smallNumberOfSlides) {
        return "borderAnimationS";
      }
      else if (this.slideNodes.length < mediumNumberOfSlides) {
        return "borderAnimationM";
      }
      return "borderAnimationL";
    }
  });

  return SlideDeck;

});
