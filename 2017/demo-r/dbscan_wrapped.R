#Wrapping Functionality
tool_exec <- function(in_params, out_params){
  
  #####################################################################################################  
  ### Obtain Geoprocessing Environment Settings
  #####################################################################################################   
  env <- arc.env()
  workspace <- env$workspace
  cat(paste0("\n", "............................................", "\n"))
  cat(paste0("\n", "Current Workspace:", "\n"))
  print(workspace)
  
  #####################################################################################################  
  ### Check/Load Required Packages  
  #####################################################################################################   
  arc.progress_label("Loading packages...")
  arc.progress_pos(20)
  
  if(!requireNamespace("arcgisbinding", quietly = TRUE))
    install.packages("arcgisbinding", quiet = TRUE) 
  if(!requireNamespace("sp", quietly = TRUE))
    install.packages("sp", quiet = TRUE)
  if(!requireNamespace("dbscan", quietly = TRUE))
    install.packages("dbscan", quiet = TRUE)
  
  require(arcgisbinding)
  require(sp)
  require(dbscan)
  
  ##################################################################################################### 
  ### Define input/output parameters
  #####################################################################################################
  occurrence_dataset <- in_params[[1]]
  eps <- in_params[[2]]
  minPts <- in_params[[3]]
  search <- in_params[[4]]
  
  out_feature <- out_params[[1]]
  
  ##################################################################################################### 
  ### Load Data and Create an object of class "sp"
  #####################################################################################################
  arc.progress_label("Loading data...")
  arc.progress_pos(40)
  
  t <- arc.open(occurrence_dataset)
  t_df <- arc.select(t)
  data_shp <- arc.shape(t)
  t_spdf <- arc.data2sp(t_df)
  coords <- coordinates(t_spdf)
  
  ##################################################################################################### 
  ### Calculate Desnity Based Clustering
  #####################################################################################################
  arc.progress_label("Calculating Density Based Clustering:")
  arc.progress_pos(60)
  cat(paste0("\n", "............................................", "\n"))
  cat(paste0("\n", "Beginning Calculation...", "\n"))
  
  db <- dbscan::dbscan(coords, eps, minPts)
  
  cat(paste0("\n", "............................................", "\n"))
  cat(paste0("\n", "Density Based Clustering Results...", "\n"))
  print(db)
  
  t_spdf$Category <- db$cluster
  
  ##################################################################################################### 
  ### Write Output
  #####################################################################################################
  arc.progress_label("Writing Output...")
  arc.progress_pos(80)
  
  if(!is.null(out_feature) && out_feature != "NA")
    arc.write(out_feature, t_spdf)
  
  arc.progress_pos(100)
  
}
