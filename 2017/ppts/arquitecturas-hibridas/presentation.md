<!-- .slide: class="title" -->

## Arquitecturas híbridas

Raúl Jiménez Ortega ([@hhkaos](//twitter.com/hhkaos))

[bit.ly/DevSummit17-X](#)

---

<!-- .slide: class="agenda" -->

### Agenda

* Tirando un mito
* Tipos de cuenta
* Qué se puede y qué no
* Casos prácticos

---

<!-- .slide: class="section" -->

### Tirando un mito

> Si se var desarrollar una app usando ArcGIS y var a tener 1000, un millón, o los usuarios
registrados que sea... `no implica necesariamente que haya que comprar ese número de usuarios nominales`.


---

<!-- .slide: class="section" -->

### Tipos de cuenta

|Tipos de cuenta|Coste|Propósito|Ámbito|
|---|---|---|---|
|[Cuenta pública](https://www.arcgis.com/home/createaccount.html)|No|Personal|Cloud|
|[Usuario de organización - Nivel 1](http://www.esri.com/arcgis/trial)|Sí|Profesional|Cloud & On-premise|
|[Usuario de organización - Nivel 2](http://www.esri.com/arcgis/trial)|Sí|Profesional|Cloud & On-premise|
|[Cuenta de desarrollador](https://developers.arcgis.com/sign-up)|No|Dev & Test|Cloud|

--

### Cuenta pública

|Puede|No puede|
|---|---|
|Crear Web Maps, Web Scenes, alojar fichero estáticos (CSV, KML,...) y crear notas de mapa|Hacer análisis, crear servicios
|Crear storymaps y apps configurables|Usar apps configurables personalizadas
|Crear grupos|Unirse a grupos creados por orgs
|Cargar sus contenidos y los de 3os en un mapa|Configurar geocodificador, etc.

Ideal para modelos B2C ¿y B2G que incluyen al ciudadano? <- REST API

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

* Combinar cuentas públicas y de organización
* Seguir un enfoque híbrido (usuarios ArcGIS y propios)
* Extender con oAuth ([Ipsilum](https://docs.google.com/presentation/d/1-jg8KKDmBRqk7ziVRIxZ68O-Z7DS-cXsEENt5Qw85O8/edit?usp=sharing))
* Usar un proxy + oauth/credenciales para crear una app <br>
  que acceda a contenidos premium o permita hacer análisis espacial

--

### No se puede

* Utilizar un sistema de usuarios y control de acceso a los datos geográficos
* Intentar ArcGIS como gestor de contenidos geo
* Embeber credenciales de un usuario en una app o proxy para acceder a los datos y posteriormente añadir encima un control de acceso personalizado.

--

### Regla a aplicar

> Solo necesitaremos un usuario de organización (de pago) cuando queramos que este
**pueda trabajar con información no pública, formar parte de grupos o queramos que
pueda crear servicios** (entidades, imágenes, etc).

> Si este no es el caso podemos plantear la opción de una cuenta pública o un usuario propio

---

<!-- .slide: class="section" -->

### Casos prácticos

\- Aplicaciones de modelos híbridos -

--

## Caso: Portal Inmobiliario (B2C)

> Los empleados registran nuevos apartamentos, los usuarios buscan pisos,
hacen análisis espacial, guardan favoritos, etc. Para el análisis usan un proxy.

* Empleados:
  * Gestionan la info geográfica: Usuarios nominales (L2)
  * Necesitan acceso sólo lectura a info privada geoloc: Usuarios nom. (L1)
  * No trabajan con info geogr. privada (financiero, etc) pero pueden requerir<br>
  de hacer análisis espacial o contenido premium: usuarios propios
* Clientes:
  * Guardan pisos como favoritos, comentan los pisos, etc: usuarios propios

--

## Caso: Ipsilum (B2B)

> Herramienta para la planificación de vuelos de drones dirigida a pilotos de
drones, cartógrafos, etc

* Usuarios con registro propio (o social login)
* Pobilidad de conectar tu usuario nominal (si dispones de él)

--

## Caso: Ayto de Liliput (B2G)

> Aplicación de participación ciudadana <- GeoHub?

* Empleados: usuarios nominales
* Ciudadanos: usuarios propios


---

<!-- .slide: class="section centered" -->

## Questions?

* Raúl Jiménez Ortega: raul.jimenez@esri.es

Slides: [bit.ly/DevSummit17-X](#)

---

<!-- .slide: class="end" -->
#
