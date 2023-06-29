import json
from ib_insync import *
import datetime
main = IB()
main.connect("127.0.0.1",7497,5)

completeOrders = main.trades()
dictOrders = []
for itemA in completeOrders : 
    item = itemA.dict()   
    orderDict = item["order"].dict()
    del orderDict['softDollarTier']
    contractDict = item["contract"].dict()
    statusDict = item["orderStatus"].dict()

    itemDict = {"orderId":orderDict['permId'], "action": orderDict["action"], "quantity": orderDict["filledQuantity"],"orderType":orderDict['orderType'] ,'symbol':contractDict['symbol'], 'status' : statusDict["status"]}
    if(orderDict['orderType'] == "MKT") :
        itemDict['price'] =orderDict['trailStopPrice']
    else : 
        itemDict['price'] = orderDict['lmtPrice']
    if item["fills"] and item["fills"][0] :         
        itemDict['execId'] =item["fills"][0].execution.dict()["execId"]
    if item['log'] and len(item['log']) > 0 :         
        itemDict['time'] = str(item['log'][0].dict()['time'])
    else:
        itemDict['time'] = "NO TIME"
    dictOrders.append(itemDict)

print(json.dumps(dictOrders))

main.disconnect()







