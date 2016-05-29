<!-- .slide: class="title" -->

## ArcGIS API for JavaScript
## Discover 4.0 - the Next Generation
[Carlos Pérez](http://geodevelopers.org/members/200045805) & [Raúl Jiménez](http://geodevelopers.org/members/139909072)

[bit.ly/devsummit4](http://bit.ly/devsummit4)

---

<!-- .slide: class="agenda" -->

## Agenda

* Overview
* New coding patterns
* Map and View architecture
* New classes
* Portal API Redesigned
* Widgets and UI

---

<!-- .slide: class="section" -->

# Overview

---

## Overview:

* Project started late 2013 from scratch
* Introduction of 3D and WebScene
* New [WebScene Viewer](http://www.arcgis.com/home/webscene/viewer.html) built with new API
* Platform first:
  - New Portal API
  - Better integration of `WebMap`
* AMD only
* Modern browsers only: `IE11+`


---

<!-- .slide: class="section" -->

# Coding patterns

---

## Promises

--

> All asynchronous methods return a promise, no more [events](https://developers.arcgis.com/javascript/3/jsapi/querytask-amd.html#events)

```js
  someAsyncFunction().then(
    function(resolvedVal){
      console.log(resolvedVal);  //logs the value the promise resolves to
    },
    function(error){
      console.error(error);  //logs the error message
    }
  );
```

--

> Classes may be a promise asychronously initialized: <br>Ex: `Layer`, `WebMap`, `WebScene` & `View`

```js
var map = new Map({...})

view = new SceneView({
  map: map,
  //...
});

view.then(function() {
  // map is loaded
  // container height is loaded
  // etc.
});
```
* `view.then()` replaces `map.on('load', ...)`

---

## Loadables

--

Get a feature from a FeatureLayer from a WebMap without displaying it

```js
  var webmap = new WebMap({
    portalItem: {
      id: 'affa021c51944b5694132b2d61fe1057'
    }
  });

  webmap.load()
    .then(function() {
      return webmap.getLayer('myFeatureLayerId').load();
    })
    .then(function(featureLayer) {
      return featureLayer.queryFeatures({
        where: 'OBJECTID = 1'
      });
    })
    .then(function(result) {
      displayDetails(result.features[0]);
    })
    .otherwise(function(error) {
      console.error(error);
    });
```

---

<!-- .slide: class="section" -->

# Map and View architecture

--

![Map&View](images/api-diagram-0b.png)

--

![Map&View](images/api-diagram-1.png)

--

![Map&View](images/api-diagram-2.png)

---

<!-- .slide: class="section" -->

# New classes

---

## Class:
### [`esri/core/Accessor`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Accessor.html)

* Allows:
  * Properties watching
  * Autocast
  * Computed properties
  * ...

<!--- base class of most of the API
- consistent pattern:
 - getting and setting properties value
 - watching properties change
- unifed object constructor
- computed properties
- autocast-->

--

## `Accessor`: Properties watching

<!--
- Direct benefits:
 - remove inconsistancies between constructor, getter, setter functions, events
 - one convention everywhere. _"just need to know what properties for a class"_
 - Single object constructor, no more 3+ constructors
 - Leaner SDK: we doc only the properties, the rest is convention-->

- Changes:
 - no more **_property_**-change events, use `watch()`
 - in 3.x, listen for [`extent-change`](https://developers.arcgis.com/javascript/jsapi/map-amd.html#event-extent-change) event.
 - in 4.0 `extent` watchers will be call very often

--

## `Accessor`: Properties watching

```javascript
var map = new Map(...);
var view = new MapView({ map: map });

// watch for view scale updates
view.watch('scale', function(newValue, oldValue, property, target) {
  console.log(newValue, oldValue, property, target);
})

// chain watching
map.watch('basemap.title', function(value) {
  console.log(value);
});
map.basemap = 'topo';
```

- [demo](http://esri-es.github.io/JavascriptAPI/src/tutoriales/tutorial_17.html)

--

## `Accessor`: Autocast

```js
  // 3.x
  new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10,
    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
    new Color([255,0,0]), 4),
    new Color([255,255,255,0.25]));

  // 4.0
  new SimpleMarkerSymbol({
    style: 'square',
    color: 'red',
    size: 10,

    outline: {
      color: 'rgba(255, 255, 255, 0.5)'
      width: 4
    }
  });
```

--

## `Accessor`: Computed properties

```js
var Person = Accessor.createSubclass({
  classMetadata: {
    properties: {
      fullName: {
        readOnly: true,
        dependsOn: ['lastname', 'firstname']
      }
    }
  },

  _fullNameGetter: function() {
    return this.firstname + ' ' + this.lastname;
  }
});

var JohnDoe = new Person({
  firstname: 'John',
  lastname: 'Doe'
});
```
* [demo](http://localhost:9090/2016/sesion-inaugural/demos/5-platform/webmap.html)

---

## Classes:
### [`esri/views/MapView`](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html)  
### [`esri/views/SceneView`](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-SceneView.html)

--

Multiple views for one map

```js
  var map = new Map({
    basemap: 'topo',
    layers: [
      new ArcGISDynamicLayer(...)
    ]
  });

  var mapView = new MapView({
    map: map,
    container: 'mapDiv'
  });

  var sceneView = new SceneView({
    map: map,
    container: 'sceneDiv'
  });
```

--

## Animation

- both in 2D and 3D, navigating around can be complex
- generic function `goTo(target, options):Promise`
- accepts a wide variety of target parameters

```js
querytask.execute(query)
  .then(function(result) {

    // Animate to the features
    return view.goTo(result.features, {
      duration: 3000
    });

  })
  .then(function() {
    // animation is done
  });
```

---

## Class:
### [`esri/core/Collection`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html)

--

## Collections

 - More or less like an Array
 - in house methods [`add`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#add) / [`remove`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#remove) ...
 - array methods [`forEach`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#forEach) / [`map`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#map) ...
 - newer array methods [`find`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#find) / [`findIndex`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#findIndex)...
 - emit [`"change"`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html#events) events when something is added/removed/moved
 - used for layers, used for layers in Basemap, used for graphics...
 - autocasting support


--

## Collections: Sample

```js
var PointCollection = Collection.ofType(Point);
var collection = new PointCollection();

collection.add([-100,40]);

var point = collection.getItemAt(0);
//point.x = -100; point.y = 40

var layerCollection = Map.layers();
//Map.layers() returns a Collection

layerCollection.remove(layer);
```

---

## Class:
### [`esri/views/layers/LayerView`](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-layers-LayerView.html)

--

## LayerViews

- Give info about layer rendering
 - 3.x: `Layer.suspended` now `LayerView.suspended`
- Will give access to data displayed on the screen
 - Features
 - Elevation data
- Ability to override properties from the layer
 - visibility
 - renderer
 - ...

--

## LayerViews

- access a layerview with [`View.whenLayerView()`](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-View.html#whenLayerView)

```js
  var map = new Map({
    basemap: 'topo'
  });
  var mapView = new MapView({
    map: map,
    container: 'mapDiv'
  });

  var layer = new FeatureLayer(...)
  map.add(layer);

  view.whenLayerView(layer)
    .then(function(layerView) {
      layerView.visible = false
    });
```

---

## Class:
### [`esri/Basemap`](https://developers.arcgis.com/javascript/latest/api-reference/esri-Basemap.html)

--

## Basemap

- Basemap's layers are _not_ part of the `map.layers`, but from `map.basemap`
- Contains 2 Collections: `baseLayers`, `referenceLayers`

```js
// 3.x
var layerUrl = map.getLayer("layer0").url;

// 4.x
var baseLayers = map.basemap.baseLayers.getAll();
var referenceLayers = map.basemap.referenceLayers.getAll();

// Also this:
var layers = map.layers;
// Returns a collection of the operational layers
// mixing image AND graphics
```


--

## Basemap

- `basemap` as a string, creation of the appropriated Basemap instance

```js
var map = new Map({
  basemap: 'topo'
});

map.basemap = 'streets';
```

- `basemap` as an instance of `Basemap`

```js
var map = new Map({/*...*/});

var toner = new Basemap({
  baseLayers: [
    new WebTiledLayer({
      urlTemplate: '...'
    })
  ]
})

map.basemap = toner;
```

---

## Classes:
### [`esri/WebMap`](https://developers.arcgis.com/javascript/latest/api-reference/esri-WebMap.html)
### [`esri/WebScene`](https://developers.arcgis.com/javascript/latest/api-reference/esri-WebScene.html)

--

## `WebMap` and `WebScene`

- `WebMap` is the document of a 2D Map
- `WebScene` is the document of a 3D Map
- extend common `Map` class
- can be consumed by apps accross the platform
- Similarities:
 - `basemap`
 - operational data: `layers`
- Specialities:
 - environment, ground, SceneLayer, camera, viewingMode,...
 - more...

--

## `WebMap` and `WebScene`

```js
var webmap = new WebMap({
  portalItem: {
    id: 'e691172598f04ea8881cd2a4adaa45ba'
  }
});
```
[demo](../sesion-inaugural/demos/5-platform/webmap.html)

```js
var webscene = new WebScene({
  portalItem: {
    id: '19dcff93eeb64f208d09d328656dd492'
  }
});
```
[demo](../sesion-inaugural/demos/5-platform/webmap.html/webscene.html)

--

## `WebScene` specificities - `slides`

- created with the webscene viewer
- store layers visibility, camera, environment

```js
// slides from webscene's presentation
var slides = scene.presentation.slides;

// create a clickable thumbnails
slides.forEach(function(slide) {
  var thumb = new Slide({
    slide: slide
  });
  thumb.on('click', function() {
    // apply the slide on the view
    slide.applyTo(view);
  });
  slidesDiv.appendChild(thumb.domNode);
});

```

--

## WebScene specificities - `viewingMode`

- visualize `global` or `local` scenes
- `local` scenes are best for projected data and underground display

```js
var view = new SceneView({

  viewingMode: 'local',

  clippingArea: {
    xmin: ...
    ymin: ...
    xmin: ...
    ymin: ...
    spatialReference: ...
  },

  map: new WebScene(...)
});

```

- [demo](demos/platform/webscene-local.html)

---

<!-- .slide: class="section" -->

# Portal API Redesigned

---

<!-- .slide: class="background" -->

## Classes:
### [`esri/portal/Portal`](https://developers.arcgis.com/javascript/latest/api-reference/esri-portal-Portal.html)
### [`esri/portal/PortalQueryParams`](https://developers.arcgis.com/javascript/latest/api-reference/esri-portal-PortalQueryParams.html)
...

--

## Portal

- Access portal information: basemaps, feature services, etc.
- Query items, users and groups.
- Loading items like layers, webmap and webscene.
- Creating, deleting and updating items.

--

## Portal API

```js
var portal = new Portal();

// Setting authMode to immediate signs the user in once loaded
portal.authMode = 'immediate';

// Once loaded, user is signed in
portal.load()
  .then(function() {
    // Create query parameters for the portal search
    var queryParams = new PortalQueryParams({
      query: 'owner:' + portal.user.username,
      sortField: 'numViews',
      sortOrder: 'desc',
      num: 20
    });

    // Query the items based on the queryParams created from portal above
    portal.queryItems(queryParams).then(createGallery);
  });
```

[demo](/javascript/4/sample-code/identity-oauth-basic/live/index.html)

--

## Portal API

```js
var promise = Layer.fromPortalItem({
  portalItem: {
    id: '8444e275037549c1acab02d2626daaee',
    portal: {
      url: 'https://myorg.maps.argis.com'
    }
  }
})
.then(function(layer) {
  // Adds the layer to the map once it loads
  map.add(layer);
})
.otherwise(function(error) {
  //handle the error
});
```

[demo](/javascript/4/sample-code/layers-portal/live/index.html)

---

<!-- .slide: class="section" -->

# Widgets and UI

---

## Widgets - View Model

- New architecture
- Logic of the widget separated from the representation
- View implementations made in dijit/Accessor
- Views' source code available in the [documentation site](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Zoom.html)
- Source Code available - [View Model & SASS](https://github.com/Esri/arcgis-js-api/tree/4master/widgets)
- View's can be rewritten in [any framework](demos/widgets/framework/index.html)
- ViewModels can be combined to create [Frankenwidgets](demos/widgets/frankenwidget/index.html)

---

## UI

- Managed overlay to place widgets over the view.
- Well known widgets can be directly added or removed from the view
- [Provides responsive information](demos/ui/responsive.html), [plenary demo](demos/ui/popup-responsive/index.html)

```js
var view = new MapView({

  ui: {

    padding: {
      top: 16,
      left: 16,
      right: 16,
      bottom: 16
    },

    components: ["zoom", "compass", "attribution"]

  }

});
```

--

## `view.ui.add`

- API to add widgets or any DOM element to the 4 corners of the view

```js
var view = new MapView({
  //...
});

var legend = new Legend({
  //...
});

view.ui.add(legend, "top-left");
```

- [All widgets](demos/widgets/all-widgets.html)


---

<!-- .slide: class="background centered" -->

## Resources:

* ArcGIS API for JavaScript Discover 4.0 <br>the Next Generation: [Video](http://video.esri.com/watch/5024/arcgis-api-for-javascript-discover-40-the-next-generation) & [Slides](http://ycabon.github.io/presentations/2016-devsummit-discover-4.0-the-next-generation/#/)

---

<!-- .slide: class="questions centered" -->

## Questions

@hhkaos  
raul.jimenez@esri.es

@jimen0

carlospj@icloud.com

[bit.ly/devsummit4](http://bit.ly/devsummit4)

---


<!-- .slide: class="end" -->
