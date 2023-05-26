
import json
from ib_insync import *
main = IB()
main.connect("127.0.0.1",7497,6)

openOrders =  main.reqAllOpenOrders()
dictOrders = []
for item in openOrders : 
    orderDict = item.order.dict()
    del orderDict['softDollarTier']
    contractDict = item.contract.dict()
    timeDict = str(item.log[0].dict()['time'])
    itemDict = {"orderId":orderDict['permId'], "action": orderDict["action"], "quantity": orderDict["filledQuantity"], "orderType":orderDict['orderType'] , "price" : orderDict['lmtPrice'],'symbol':contractDict['symbol'],'time':timeDict}
    dictOrders.append(itemDict)

print(json.dumps(dictOrders))

main.disconnect()