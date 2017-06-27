<!-- .slide: class="title" -->

## Arquitecturas híbridas

Raúl Jiménez Ortega ([@hhkaos](//twitter.com/hhkaos))

[bit.ly/DevSummit17-4](http://bit.ly/DevSummit17-4)

---

<!-- .slide: class="agenda" -->

### Agenda

* Desmontando un mito
* Tipos de cuentas
* Qué se puede y qué no
* oAuth & refresh_token
* Caso práctico

---

<!-- .slide: class="section" -->

### Desmontando un mito

> Si se vas desarrollar una app usando ArcGIS y va a tener 1000, un millón, o los usuarios
registrados que sea... `no implica necesariamente que haya que comprar ese número de usuarios nominales`.

<img src="imgs/omg-really.png" alt="OMG Really" style="width:200px;border:2px solid #c99044">


--

<!-- .slide: class="white" -->

![Jack el Destripador, vayamos por partes](imgs/JackRipper.jpg)

---

<!-- .slide: class="section" -->

### Tipos de cuentas

|Tipo|Coste|Propósito|Ámbito|
|---|---|---|---|
|[Cuenta pública](https://www.arcgis.com/home/createaccount.html)|No|Personal|Cloud|
|[Usuario de organización - Nivel 1](http://www.esri.com/arcgis/trial)|Sí|Profesional|Cloud & On-premise|
|[Usuario de organización - Nivel 2](http://www.esri.com/arcgis/trial)|Sí|Profesional|Cloud & On-premise|
|[Cuenta de desarrollador](https://developers.arcgis.com/sign-up)|No|Dev & Test|Cloud|

--

### Cuenta pública

|Puede|No puede|
|---|---|
|Crear Web Maps, Web Scenes, alojar ficheros estáticos (CSV, KML,...) y crear notas de mapa|Hacer análisis, crear servicios
|Crear storymaps y apps configurables|Usar apps configurables personalizadas ni Web AppBuilder
|Crear grupos|Unirse a grupos creados por organizaciones
|Cargar sus contenidos y los de 3os en un mapa|Configurar geocodificador, etc.

Considerar para modelos B2C ¿y B2G que incluyen al ciudadano? <- REST API

--

### Usuario de organización - Nivel 1

[![Pantallazo Privilegios](imgs/privilegios-agol-level1.jpg)](imgs/privilegios-agol-level1.jpg)

El administrador define los roles y sus privilegios + Apps

--

### Usuario de organización - Nivel 2

[![Pantallazo Privilegios](imgs/privilegios-agol-level2.jpg)](imgs/privilegios-agol-level2.jpg)

El administrador define los roles y sus privilegios + Apps

--

### Cuenta de desarrollador

> La cuenta de desarrollador `es una cuenta de organización mono-usuario de nivel 2`
que se puede usar para desarrollar aplicaciones y testearlas, pero no para sacar una aplicación
a producción <- salvo si no tiene ánimo de lucro.

---

<!-- .slide: class="section" -->

### Qué se puede y qué no

--

### Se puede

* Usar cuentas públicas y de organización en una misma app
* Seguir un enfoque híbrido (usuarios ArcGIS y propios)
* Usar la conexión con ArcGIS para ampliar funcionalidad ([Ipsilum](https://docs.google.com/presentation/d/1-jg8KKDmBRqk7ziVRIxZ68O-Z7DS-cXsEENt5Qw85O8/edit?usp=sharing))
* Usar un proxy + oAuth (o credenciales) para crear una app que usuarios<br>
sin cuenta de ArcGIS puedan:
  * Visualizar contenidos Premium<br>
  * Consumir servicios de ArcGIS Online con coste en créditos
  * Limitar el acesso público de un servicio a una serie de dominios

--

### No se puede (por TOS)

* Crear un sistema propio de control de acceso a los <br>
  datos geográficos que permita `utilizar/compartir un` <br>
  `solo usuario nominal entre varios usuarios`.

* `Embeber credenciales de un usuario nominal`<br>
  `en una app o proxy` para darle privilegios a varios usuarios<br>
  ("puentear" los usuarios nominales) para por ejemplo: crear<br>
  servicios o items, permitir el acceso a datos privados a ciertos<br>
  usuarios, compartir items con grupos, etc.

--

### En definitiva

Necesitaremos un usuario de organización (de pago) cuando necesitemos:
* Limitar (por usuario) el acceso a información no pública (alojada en ArcGIS).
* Que el usuario pueda formar parte de grupos (de ArcGIS)
* Que pueda hacer uso de las apps (Collector, Web AppBuilder, etc)
* O queramos que este pueda crear servicios de: entidades, imágenes, etc.

> Si el usuario no requiere de ninguna de estas funcionalidades podremos Usar
cuentas públicas de ArcGIS o un sistema de usuarios propio

---

<!-- .slide: class="section" -->

### oAuth y refresh_token

\- diagrama -

--

[![oAuth diagram](https://docs.google.com/drawings/d/1LxJy0p988F6Bhjrz-rE1WWpso-f-HCdumCUE9UfG-dI/pub?w=700)](https://docs.google.com/drawings/d/1LxJy0p988F6Bhjrz-rE1WWpso-f-HCdumCUE9UfG-dI/edit?usp=sharing)

---

<!-- .slide: class="section" -->

### Casos práctico

\- una app con modelo híbrido -

--

<!-- .slide: class="section" -->

## Caso: Portal Inmobiliario (B2C)

> * **Empleados**: gestionan los apartamentos, pedidos, etc.
* **Clientes**:
  * Inquilinos y compradores: buscan pisos,
hacen análisis espacial (ArcGIS Online), guardan favoritos, preferencias de búsqueda, etc.
  * Propietarios: publican y gestionan sus viviendas, cambian la visibilidad de sus pisos, etc.

--

### Empleados

* **Usuarios org. (L2)**: Crear y gestionan la BD de pisos, <br>
  y demás info geolocalizada (por ej: dpto. operaciones)

* **Usuarios org. (L1)**: Si necesitan acceso sólo lectura <br>
  a info privada (como pisos que estén alquilados)<br>
  (por ej: dpto. financiero)

* **Usuarios propios**: No trabajan con info geogr. privada<br>
  pero pueden requerir de hacer análisis espacial, acceder<br>
  a contenido premium o crear storymaps (por ej: dpto. <br>
  marketing)

--

### Clientes

* **Usuarios org. (L2)**: Si los propietarios<br>
  de pisos puedan publicar directamente sus pisos en<br>
  ArcGIS y acceder a información geolocalizada restringida.

* **Usuarios propios**: buscar y guardan<br>
  pisos como favoritos, comentan los pisos, etc.

* **Cuentas públicas**: si queremos que puedan crear <br>
  web maps, storymaps, etc.

* **Proxy**: si queremos que puedan hacer análisis <br>
  usando servicios de ArcGIS Online.


---

<!-- .slide: class="section centered" -->

## ¿Preguntas?

* Raúl Jiménez Ortega: raul.jimenez@esri.es

Feeback: [bit.ly/DevSummit17-FB](http://bit.ly/DevSummit17-FB)

Transparencias: [bit.ly/DevSummit17-4](http://bit.ly/DevSummit17-4)

---

<!-- .slide: class="end" -->
#
