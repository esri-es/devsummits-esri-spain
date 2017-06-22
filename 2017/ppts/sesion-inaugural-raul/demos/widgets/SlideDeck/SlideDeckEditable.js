define([
  "esri/core/declare",
  "../../webscene/Slide",
  "dojo/dom-class", "dojo/dom-construct", "dojo/on",
  "webSceneViewer/widgets/SlideDeck/SlideDeck",
  "dijit/InlineEditBox",
  "dojo/topic",
  "dojox/mdnd/AreaManager",
  "dojox/mdnd/DropIndicator",
  "dojox/mdnd/dropMode/OverDropMode",
  "../OptionsMenu/OptionsMenu",
  "dojo/fx",
  "dojo/_base/fx",
  "dojox/fx/style",
  "dojo/fx/easing",
  "dojo/dom-geometry",
  "dojo/sniff",
  "dojo/i18n!../nls/widgets"
],


  function(declare, Slide, domClass, domCtr, on,
    SlideDeck,
    InlineEditBox,
    topic,
    AreaManager,
    DropIndicator,
    OverDropMode,
    OptionsMenu,
    coreFx,
    dojoBaseFx,
    fxStyle,
    dojoEasing,
    domGeometry,
    sniff,
    i18n) {

    // / animation to fold additional tabs back
    function thumbnailAnimation(thumbnailDiv) {

      // var animationLength = 600;
      var snapAnimation = 200;
      var moveAnimation = 350;

      thumbnailDiv = thumbnailDiv.childNodes[0].childNodes[2];
      var thumbnailAnim = document.getElementById("slideThumbnailAnimation");
      var map = document.getElementById("webscene-map");
      var positionTarget = domGeometry.position(thumbnailDiv);
      var positionSource = domGeometry.position(map);
      var animations = [];
      animations.push(fxStyle.addClass(thumbnailDiv, "hidden", {duration: 1}));
      thumbnailAnim.style.left = positionSource.x + "px";
      thumbnailAnim.style.top = positionSource.y - 61 + "px";
      thumbnailAnim.style.height = positionSource.h + "px";
      thumbnailAnim.style.width = positionSource.w + "px";
      thumbnailAnim.style.opacity = 0.2;
      thumbnailAnim.style.backgroundColor = "transparent";
      thumbnailAnim.style.border = "12px solid white";
      thumbnailAnim.style.zIndex = 101;
      // thumbnailAnim.style.backgroundImage = "url("+thumbnailDiv.src+")";
      thumbnailAnim.style.backgroundSize = "cover";
      thumbnailAnim.style.backgroundRepeat = "no-repeat";
      domClass.remove(thumbnailAnim, "hide");


      var propAnim1 = dojoBaseFx.animateProperty({
        node: "slideThumbnailAnimation",
        properties: {
          opacity: 0.9
        },
        duration: snapAnimation / 2,
        easing: dojoEasing.quadIn
      }) ;
      animations.push(propAnim1);

      var propAnim1a = dojoBaseFx.animateProperty({
        node: "slideThumbnailAnimation",
        properties: {
          opacity: 0.2
        },
        duration: snapAnimation / 2,
        easing: dojoEasing.quadOut,
        onEnd: function() {
          thumbnailAnim.style.backgroundImage = "url(" + thumbnailDiv.src + ")";
          thumbnailAnim.style.opacity = 0.0;
          thumbnailAnim.style.border = "0px solid white";
        }
      }) ;
      animations.push(propAnim1a);


      var propAnim2 = dojoBaseFx.animateProperty({
        node: "slideThumbnailAnimation",
        properties: {
          height: positionTarget.h,
          width: positionTarget.w,
          top: positionTarget.y - 61,
          left: positionTarget.x
        },
        duration: moveAnimation,
        unit: "px",
        easing: dojoEasing.quadOut
      }) ;


      var propAnim3 = dojoBaseFx.animateProperty({
        node: "slideThumbnailAnimation",
        properties: {
          opacity: 0.95
        },
        duration: moveAnimation,
        unit: "px",
        delay: 50,
        easing: dojoEasing.linear
      }) ;

      var animations2 = [propAnim2, propAnim3];

      animations.push(coreFx.combine(animations2));
      animations.push(fxStyle.removeClass(thumbnailDiv, "hidden", {duration: 1}));
      animations.push(fxStyle.addClass(thumbnailAnim, "hide", {duration: 1}));

      coreFx.chain(animations).play();

    }

    var SlideDeckEditable = declare(SlideDeck, {
      name: "SlideDeckEditable",
      baseClass: "SlideDeckEditable",
      editor: undefined,
      editedSlideIndex: -1,
      slideEdited: false,

      constructor: function(options, domNode) {
        this.editor = options.editor;
        domClass.add(domNode, "slideDeckEditable");
      },
      // overriden from parent
      _initialize: function() {
        this._initDragAndDrop();
        this._createSlideEditables();
        this._createAddSlideButton(this.mainContainerNode);
        this.inherited(arguments);
      },

      _initDragAndDrop: function() {
        if (this._dragManager) {
          return;
        }

        this._dragManager = new AreaManager();
        this._dragManager._dropIndicator = new DropIndicator();
        this._dragManager._dropMode = new OverDropMode();

        topic.subscribe("/dojox/mdnd/drop", function(node, target, indexChild) {
          if (target.node !== this.innerContainer) {
            return;
          }

          var previousSlideIndex = parseInt(node.getAttribute("nr"), 10);
          this.webScene.presentation.slides.reorder(this.webScene.presentation.slides.getItemAt(previousSlideIndex), indexChild);

          if (node.attributes.nr.value != indexChild) {
            this.appState.view.map.hasUnsavedChanges = true;
          }
        }.bind(this));
      },

      _createAddSlideButton: function(domNode) {

        if (this.addSlideNode) {
          domCtr.destroy(this.addSlideNode);
        }

        // add slide button
        this.addSlideNode = domCtr.create("div", {
          "class": "slide addSlide"
        });
        domCtr.place(this.addSlideNode, domNode, "last");


        var slideButton = domCtr.create("button", {
          "class": "orangeButton"
        }, this.addSlideNode);

        domCtr.create("p", {
          "class": "addChar",
          innerHTML: "+ " + i18n.slideDeckEditable.addSlide
        }, slideButton);
        on(slideButton, "click", function() {

          Slide.createFrom(this.appState.view, {screenshot: {width: 114, height: 62} }).then(function(newSlide) {

            // Ensure unique slide name
            var i = 1;
            if (this.webScene.presentation) {
              var slides = this.webScene.presentation.slides;
              i = slides.length + 1;
              while (slides.find(function(slide) {
                return slide.title.text === (i18n.slideDeckEditable.slide + " " + i);
              })) {
                i++;
              }
            }
            newSlide.title = {
              text: i18n.slideDeckEditable.slide + " " + i
            };

            this.appState.view.map.hasUnsavedChanges = true;
            this.appState.view.map.presentation.slides.push(newSlide);
            this.startEditing = newSlide.id;
            this._slideEdited(this.appState.view.map.presentation.slides.length - 1);
          }.bind(this)).otherwise(function(err) {
            console.error(err);
          });
        }.bind(this));
      },

      _createSlideEditables: function() {

        for (var slideIdx = 0; slideIdx < this.slideNodes.length; slideIdx++) {
          var slideNode = this.slideNodes[slideIdx];

          var slideDetails = domCtr.create("div", {
            "class": "slideDetails"
          }, slideNode);



          // edit title box
          var slide = this.webScene.presentation.slides.getItemAt(slideIdx);
          var editTitleNode = domCtr.create("div", {
            "class": "editTitle",
            title: slide.title.text
          }, slideDetails);

          var editTitleBox = new InlineEditBox({
            autoSave: true,
            value: slide.title.text,
            editor: "dijit/form/ValidationTextBox",
            editorParams: {
              regExp: "[^<>]+"
            }
          }, editTitleNode);

          editTitleBox.editorParams.invalidMessage = i18n.invalidTitle;

          if (this.startEditing === slide.id) {
            editTitleBox.edit();
            this.startEditing = null;
          }

          on(editTitleBox, "change", function(slide, value) {
            slide.title = {text: value};
            this.appState.view.map.hasUnsavedChanges = true;
          }.bind(this, slide));


          // update slide button
          var updateNode = domCtr.create("div", {
            "class": "iconButtonContainer2",
            title: i18n.slideDeckEditable.updateSlide
          }, slideDetails);
          var icon = domCtr.create("div", {
            "class": "updateSlide"
          }, updateNode);

          on(updateNode, "click", function(idx, evt) {
            evt.stopPropagation();
            this._updateSlide(idx);
          }.bind(this, slideIdx));

          //
          // @javi5947
          //
          // Edge only - do not create a remove slide button
          // see details here: https://devtopia.esri.com/WebGIS/arcgis-websceneviewer-app/issues/638
          //
          if (!sniff("edge")) {

            // remove slide button
            var removeNode = domCtr.create("div", {
              "class": "iconButtonContainer",
              title: i18n.slideDeckEditable.deleteSlide
            }, slideDetails);
            icon = domCtr.create("div", {
              "class": "deleteSlide"
            }, removeNode);

            on(removeNode, "click", function(idx, evt) {
              evt.stopPropagation();
              this._deleteSlide(idx);
            }.bind(this, slideIdx));
          }

          // edit slide button
          var editNode = domCtr.create("div", {
            "class": "editSlide"
          }, slideDetails);
          var optionsMenu = new OptionsMenu({
            entries: [{
              id: "update",
              title: i18n.slideDeckEditable.updateSlide,
              func: function(slideIdx) {
                this._updateSlide(slideIdx);
              }.bind(this, slideIdx)
            }, {
              id: "moveUp",
              title: i18n.moveUp,
              func: function(slideIdx, slideId) {
                if (slideIdx > 0) {
                  var slide = this.webScene.presentation.slides.getItemAt(slideIdx);
                  this.webScene.presentation.slides.reorder(slide, slideIdx - 1);
                  this.appState.view.map.hasUnsavedChanges = true;
                }
              }.bind(this, slideIdx, slide.id),
              className: slideIdx === 0 ? "disabled" : ""
            }, {
              id: "moveDown",
              title: i18n.moveDown,
              func: function(slideIdx, slideId) {
                if (slideIdx < (this.slideNodes.length - 1)) {
                  var slide = this.webScene.presentation.slides.getItemAt(slideIdx);
                  this.webScene.presentation.slides.reorder(slide, slideIdx + 1);
                  this.appState.view.map.hasUnsavedChanges = true;
                }
              }.bind(this, slideIdx, slide.id),
              className: slideIdx === (this.slideNodes.length - 1) ? "disabled" : ""
            }, {
              id: "rename",
              title: i18n.rename,
              func: function(editTitleBox, e) {
                editTitleBox.edit();
              }.bind(this, editTitleBox)
            }, {
              id: "delete",
              title: i18n.layerItemEditable.deleteLayer,
              func: function(slideIdx) {
                this._deleteSlide(slideIdx);
              }.bind(this, slideIdx)
            }]
          });
          optionsMenu.placeAt(editNode);

          if (this.slideEdited && (slideIdx === this.editedSlideIndex)) {
            thumbnailAnimation(slideNode);
          }
        }
        this.slideEdited = false;
      },

      _deleteSlide: function(idx) {
        this.webScene.presentation.slides.removeAt(idx);
        this.appState.view.map.hasUnsavedChanges = true;
      },

      _updateSlide: function(idx) {
        this.webScene.presentation.slides.getItemAt(idx).updateFrom(this.appState.view, { screenshot: {width: 114, height: 62} }).then(function(updatedSlide) {
          this._slideEdited(idx);
          this._update();
          this.appState.view.map.hasUnsavedChanges = true;
        }.bind(this));
      },

      // override from parent
      _update: function() {
        this.inherited(arguments);
        this._createSlideEditables();
      },

      // override from parent
      _ui: function() {
        if (this.innerContainer) {
          this._dragManager.unregister(this.innerContainer);
        }

        this.inherited(arguments);
        this._dragManager.registerByNode(this.innerContainer);
      },

      _slideEdited: function(slideIndex) {
        this.editedSlideIndex = slideIndex;
        this.slideEdited = true;
      }

    });

    return SlideDeckEditable;

  });
