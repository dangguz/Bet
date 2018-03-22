library(ggplot2)

## Load dataset ---------------------------------------------------------------
fdata <- read.table("output.csv", sep = ",", header = TRUE, stringsAsFactors = TRUE)
indexTicketCreation = (fdata$TicketCreation %in% "true") & (fdata$PriceChange %in% "false")
indexPriceChange = fdata$PriceChange %in% "true"
fdata$Result[indexTicketCreation] = 1
fdata$Result[indexPriceChange] = 2
fdata$Result = as.factor(fdata$Result)
ggplot(fdata) + geom_point(mapping = aes(x = OfferID, y = Gas, size = Quantity, color = Result))
