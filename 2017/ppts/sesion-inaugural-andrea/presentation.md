<!-- .slide: class="title" -->

## Utilizando Arcade en las plataformas ArcGIS

#### Mapping 2D


Slides : [https://github.com/Geo-Developers/talks/tree/master/slides](https://goo.gl/BzIZ9k)

--

<!-- .slide: class="section" -->

## Objetivos

- Conocer Arcade
  - ¿Qué es Arcade?
 - ¿Para qué se utiliza?

- Arcade como Lenguaje
  - Variables, Funciones, Bucles, Condiciones

- Arcade y la plataforma ArcGIS

--

<!-- .slide: class="section" -->

## ¿Qué es Arcade?

- Un nuevo lenguaje de expresión para las plataformas ArcGIS
 - ArcGIS Pro
 - Runtime SDKs
 - JavaScript API
 - Web Apps

- Principalmente diseñado para los web maps y web scenes de ArcGIS Online

--

<!-- .slide: class="section" -->


## ¿Para qué sirve Arcade?

- Arcade NO se creó para ser un Full Programming / Scripting Language
 - Objetivo: Lenguaje ligero y sencillo
 - Equivalente a una operación matemática realizada en una hoja de cálculo

- Creación de expresiones
 - Etiquetado, Representación visual, Variación de símbolos...
 - Fácil de compartir


--

<!-- .slide: class="section" -->

## ¿Para qué sirve Arcade?  


- **NO reemplaza a Python como lenguaje para la realización de Geoprocesos y Automatización**

![Flujo de trabajo](images/ArcadeProcess.PNG)

--

<!-- .slide: class="section" -->

## Arcade como Lenguaje

### Variables, Funciones, Bucles, Condicionales...

[![Resource Page](images/HelpArcadeFunctions.PNG)](https://developers.arcgis.com/arcade/function-reference/)

--

<!-- .slide: class="section" -->

## ¿Cómo funciona Arcade?

### Demo

[![Demo ArcGis Online](images/DemoArcade.PNG)](http://andrmartinro.maps.arcgis.com/home/webmap/viewer.html?useExisting=1&layers=660efc3da5114f53a3acd4230cd519af)

--

<!-- .slide: class="section" -->

## Resources

* **Documentación de Arcade:**

  [![ArcGIS Guide](images/HelpArcade.PNG)](https://developers.arcgis.com/arcade/)

--

<!-- .slide: class="section" -->

## Resources

* **Awesome List:**

  [![Awesome List](images/awesomelist.PNG)](https://esri-es.github.io/awesome-arcgis/arcgis/arcade/?h=arcade)

---

<!-- .slide: class="section" -->

## Da vida a tus datos en la plataforma ArcGIS: Vector Tiles

#### Mapping 2D

--

<!-- .slide: class="section" -->

## Objetivos

- ¿Por qué utilizar los Vector Tiles?
- Vector Tiles y la plataforma ArcGIS
- Uso de los Vector Tile en las aplicaciones
- Creacion de un Vector Tile

--

<!-- .slide: class="section" -->

## ¿Por qué utilizar los Vector Tiles?

![Vector Tiles](images/VectorTilesPhrase.PNG)

--

<!-- .slide: class="section" -->

## Ventajas de los Vector Tiles

* Calidad de Visualización
 - La mejor resolución posible para pantallas de tipo Retina
 - Formato pequeño y eficiente
* Etiquetado dinámico
 - Mayor claridad, texto más legibles
 - Etiquetado al vuelo para pantallas heads-up (HUD)
* Estilo de mapa
 - Streets, Topo, Canvas desde un tileset (paquete de teselas)
 - Modo Día y Noche
 - Remodelación

--

<!-- .slide: class="section" -->

## Vector Tiles | Basemaps y la plataforma ArcGIS

* [**Repositorio Git ESRI España**](https://github.com/esri-es/arcgis-vector-tiles)
[![Vector Tiles | Basemaps](images/RepoVectorTiles.PNG)](https://esri-es.github.io/arcgis-vector-tiles/)

--

<!-- .slide: class="section" -->

## Uso de los Vector Tiles en aplicaciones

* Multiples formas de utilizar los Vector Tile:
 - Utiliza los vector tiles que proporciona ESRI
 - Personaliza el estilo de los vector tiles según el uso que quieras darle:
   - Cambia los colores
   - Incluye Capas
   - Satisface las necesidades de tu aplicación
 - Crea tu propio Vector Tile a partir de tus propios datos

--

<!-- .slide: class="section" -->

## ¿Cómo se crean los Vector Tiles?

* Creación de las teselas en ArcGIS Pro 1.2+
* Publicar las tile layers (capas de teselas) en ArcGIS Online y ArcGIS Server/Portal 10.4+
* En ArcGis Pro 1.4
  - Permite publicar los vector tiles como Web Layer
  - Crear, editar, y publicar en un solo paso
* Herramientas relacionadas:
  - [Crear índice de teselas vectoriales](http://pro.arcgis.com/es/pro-app/tool-reference/data-management/create-vector-tile-index.htm)
  - [Crear paquete de teselas vectoriales](http://pro.arcgis.com/es/pro-app/tool-reference/data-management/create-vector-tile-package.htm)

--

<!-- .slide: class="section" -->

## ¿Cómo se crean los Vector Tiles?

* Demo

[![Demo VectorTiles](images/DemoVectorTiles.PNG)](http://andrmartinro.maps.arcgis.com/home/item.html?id=2a03e13972c846b48e0536ca9f5901b0)

--

<!-- .slide: class="section" -->

## ¿Cómo se crean los Vector Tiles?

* ArcGIS Pro

[![Vector Tile Pro](https://img.youtube.com/vi/gHhV44rdPBA/0.jpg)](https://youtu.be/gHhV44rdPBA?t=8m56s)

--

<!-- .slide: class="section" -->

## ¿Cómo se crean los Vector Tiles?

* Vector Tile publicado en ArcGIS Online

[![Vector Tile](images/VectorTilesAGOL.PNG)](http://andrmartinro.maps.arcgis.com/home/item.html?id=24d98b6d8d934849a903a0f441b7279b)

--

<!-- .slide: class="section" -->

## Resources

* **Awesome List:**

  [![Awesome List](images/awesomelist.PNG)](https://esri-es.github.io/awesome-arcgis/arcgis/content/service-types/tile-map-service/vector-tiles/?h=vector%20tiles)


---

<!-- .slide: class="section" -->

## Technology Trends

--

<!-- .slide: class="section" -->

## Aportando soluciones con la plataforma ArcGIS

* [Global Forest Watch Fires](http://www.arcgis.com/home/item.html?id=06ec4d531a8b4b5da870aab6c4adb926)

[![Demo Wind](images/DemoWind.PNG)](http://fires.globalforestwatch.org/map/#activeLayers=viirsFires%2CactiveFires%2CwindDirection%2CairQuality&activeBasemap=dark-gray&x=23&y=32&z=3)

--

<!-- .slide: class="section" -->

## Lifecycle of Technology

![Lifecycle of Technology](images/CycleTech.PNG)

--

<!-- .slide: class="section" -->

## Technology Spectrum

![Technology Spectrum](images/TechSpectrum.PNG)

--

<!-- .slide: class="section" -->

## Prototype:
### Passive Sensing

Portland, Maine (EEUU)

![Passive Sensing](images/PassiveSensing.PNG)

--

<!-- .slide: class="section" -->

## Prototype:

Melbourne, Australia

[![Melbourne](images/Melbourne.PNG)](https://youtu.be/H_cdn2kVB-E?t=3m57s)

--

<!-- .slide: class="section" -->

![VirtualReality](images/VirtualReality.PNG)

--

<!-- .slide: class="section" -->

## Prototype:

Washington D. C., EEUU

![Washington](images/Engagement.PNG)

--

<!-- .slide: class="section" -->

## Prototype:

Washington D. C., EEUU

![Washington](images/Services.PNG)

--

<!-- .slide: class="section" -->

## Demo:

Sonar

[![Sonar](https://img.youtube.com/vi/H_cdn2kVB-E/0.jpg)](https://youtu.be/H_cdn2kVB-E?t=5m17s)

* Git Repository: [Sonar Repo](https://github.com/Esri/sonar)

--

<!-- .slide: class="section" -->

## Demo:

Kuwait Finder App

[![Traffic problem](images/TrafficProblem.PNG)](https://youtu.be/H_cdn2kVB-E?t=9m57s)


---

<!-- .slide: class="end" -->
