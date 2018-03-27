library(ggplot2)
library(GGally)

## Load dataset ---------------------------------------------------------------
fdata <- read.table("output.csv", sep = ",", header = TRUE, stringsAsFactors = TRUE)
# indexTicketCreation = (fdata$TicketCreation %in% "true") & (fdata$PriceChange %in% "false")
# indexPriceChange = fdata$PriceChange %in% "true"
# fdata$Result[indexTicketCreation] = 1
# fdata$Result[indexPriceChange] = 2
# fdata$Result = as.factor(fdata$Result)
# fdata$TicketCreation = as.factor(fdata$TicketCreation)
# fdata$Quantity = as.factor(fdata$Quantity)
# fdata$PriceChange = as.factor(fdata$PriceChange)
# ggplot(fdata) + geom_point(mapping = aes(x = PrevOffers, y = TotalGas, color = PriceChange, size = Quantity, shape = TicketCreation))
fdata$Period = as.factor(fdata$Period)
fdata$index = rownames(fdata)
plot(fdata$index, fdata$TotalGas, type = "overplotted", pch = 1, col = "green", ylim = c(20000, 1000000), ylab = "Gas", xlab = "Balance Updates")
lines(fdata$index, fdata$OracleGasB, type = "overplotted", pch = 2, col="blue")
lines(fdata$index, fdata$OracleGasS, type = "overplotted", pch = 3, col="red")
legend("topleft", legend = c("Total","Buying","Selling"), pch = c(1,2,3), col = c("green","blue","red"))
# ggpairs(fdata)
