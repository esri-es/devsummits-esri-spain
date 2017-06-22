define(["require", "exports", "esri/Map", "esri/views/MapView"], function (require, exports, Map, MapView) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function createFullscreen(view) {
        var fullscreen = document.createElement("div");
        fullscreen.classList.add("esri-button", "esri-widget-button", "esri-interactive");
        var span = document.createElement("span");
        span.classList.add("esri-icon", "esri-icon-zoom-out-fixed");
        fullscreen.appendChild(span);
        view.ui.add(fullscreen, "top-left");
        fullscreen.addEventListener("click", function () {
            parent.postMessage({ type: "fullscreen" }, "*");
        });
    }
    exports.createFullscreen = createFullscreen;
    function createOverviewMap(view) {
        var div = document.createElement("div");
        div.setAttribute("id", "overviewDiv");
        view.container.appendChild(div);
        var mapView = new MapView({
            map: new Map({
                basemap: "streets"
            }),
            container: div,
            ui: {
                components: []
            },
            constraints: {
                snapToZoom: false
            }
        });
        var handle = view.watch("extent", function (extent) {
            mapView.extent = extent;
        });
        return {
            view: mapView,
            remove: function () {
                handle.remove();
                mapView.container = null;
                mapView.destroy();
                if (div.parentElement) {
                    div.parentElement.removeChild(div);
                }
            }
        };
    }
    exports.createOverviewMap = createOverviewMap;
    var addElementDiv = document.createElement("div");
    function add(view, html, eventHandlers) {
        addElementDiv.innerHTML = html;
        var elem = addElementDiv.children[0];
        addElementDiv.innerHTML = "";
        elem.classList.add("text-on-view");
        view.ui.add(elem, "top-left");
        if (eventHandlers) {
            for (var eventName in eventHandlers) {
                elem.addEventListener(eventName, eventHandlers[eventName]);
            }
        }
        return elem;
    }
    exports.add = add;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lkZ2V0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndpZGdldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7SUFRQSwwQkFBaUMsSUFBb0I7UUFDbkQsSUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUVsRixJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBRTVELFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXBDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFiRCw0Q0FhQztJQUVELDJCQUFrQyxJQUFvQjtRQUNwRCxJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRXJDLElBQUksQ0FBQyxTQUFpQixDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV6QyxJQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQztZQUMxQixHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLFNBQVM7YUFDbkIsQ0FBQztZQUVGLFNBQVMsRUFBRSxHQUFVO1lBRXJCLEVBQUUsRUFBRTtnQkFDRixVQUFVLEVBQUUsRUFBRTthQUNSO1lBRVIsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLO2FBQ2xCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBQyxNQUFtQjtZQUN0RCxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQztZQUNMLElBQUksRUFBRSxPQUFPO1lBRWIsTUFBTSxFQUFFO2dCQUNOLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFFaEIsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3pCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFbEIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO1lBQ0gsQ0FBQztTQUNGLENBQUM7SUFDSixDQUFDO0lBeENELDhDQXdDQztJQUVELElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFcEQsYUFBb0IsSUFBb0IsRUFBRSxJQUFZLEVBQUUsYUFBdUQ7UUFDN0csYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDL0IsSUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQWdCLENBQUM7UUFDdEQsYUFBYSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFFN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRTlCLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDbEIsR0FBRyxDQUFDLENBQUMsSUFBTSxTQUFTLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM3RCxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBZkQsa0JBZUMifQ==