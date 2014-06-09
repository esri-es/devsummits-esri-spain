{
   "configurationSettings":[
      {
         "category":"<b>General</b>",
         "fields":[
            {
               "type":"webmap",
               "label":"Mapa base"
            }
         ]
      },
      {
         "category":"<b>Configura la plantilla</b>",
         "fields":[
            {
            "type": "string",
            "fieldName": "logo",
            "label": "Logo URL",
            "tooltip": "",
            "stringFieldOption": "textbox",
            "placeHolder": "Logo URL"
         },
            {
            "type": "color", 
            "label": "Color de la cabecera",
            "fieldName": "headerColor"
         },
            {
               "type":"boolean",
               "fieldName":"displaytoolbar",
               "label":"Mostrar barra de herramientas",
               "tooltip":"Mostrar la barra de herramientas (Sólo en escritorio)"
            }
         ]
      },
      {
         "category":"<b>Widgets Opcionales</b>",
         "fields":[
            {
               "type":"paragraph",
               "value":"Configura los widgets de la aplicación."
            },
            {
               "type":"boolean",
               "fieldName":"locate_button",
               "label":"Mostrar botón de localización"
            },
            {
               "type":"boolean",
               "fieldName":"geocoder",
               "label":"Geocoder"
            }
         ]
      }
   ],
   "values":{
      "displaytoolbar":false,
      "locate_button":true,
      "geocoder":true
   }
}