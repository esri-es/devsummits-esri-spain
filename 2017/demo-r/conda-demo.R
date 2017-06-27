library(arcgisbinding)
arc.check_product() 
library(sp)
library(dbscan)
library(factoextra)

d <- arc.open("C:/Workspace/r_conda_demo-master/r_conda_demo-master/data/R_Conda.gdb/Public311Calls_Trash")
d_df <- arc.select(d)
data_shp <- arc.shape(d)
d_spdf <- arc.data2sp(d_df)
coords <- coordinates (d_spdf)

eps <- 1900
minPts <- 3
db <- dbscan::dbscan(coords, eps, minPts)
fviz_cluster(db, coords, stand = FALSE, ellipse = FALSE, geom = "point")





