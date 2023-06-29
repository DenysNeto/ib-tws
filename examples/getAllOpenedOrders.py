
import json
from ib_insync import *
import datetime

main = IB()
main.connect("127.0.0.1",7497,15)


contract= Future(symbol="MES",currency='USD',exchange="" ,  lastTradeDateOrContractMonth= '20230915')


#openOrders =  main.reqAllOpenOrders()

positions =  main.positions()
print(positions)

contractDetails = main.reqContractDetails(contract)
print(contractDetails)



# dictOrders = []
# for item in openOrders : 
#     orderDict = item.order.dict()
#     del orderDict['softDollarTier']
#     contractDict = item.contract.dict()
#     if(len(item.log) > 0):
#         timeDict = str(item.log[0].dict()['time'])
#     else:
#         timeDict = "NO TIME"
#     itemDict = {"orderId":orderDict['permId'], "action": orderDict["action"], "quantity": orderDict["totalQuantity"], "orderType":orderDict['orderType'] , "price" : orderDict['lmtPrice'],'symbol':contractDict['symbol'],'time':timeDict}
#     dictOrders.append(itemDict)

# print(json.dumps(dictOrders))

# main.disconnect()