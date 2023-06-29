import random
import json
from ib_insync import *
from Logger import *
import os
import time
import sys
import asyncio
import ast

ib = IB()
main = IB()
slave = IB()

with open(os.path.abspath("./sendedMessages.txt"), "r") as f:
    readed = f.read()
    if len(readed) > 0:
        sended_messages = ast.literal_eval(readed)
    else:
        sended_messages = {}


class Handler:
    def event_api_rror(self, error):
        print("API_ERROR", error)

    def event_api_start(self):
        return None

    def event_error(self, err, errCode, errMsg, arg4):
        if errCode == 1300:
            print("ERROR_EV")
        # print("ERROR EVENT", err, errCode, errMsg, arg4)


Handler = Handler()
LoggerStatus = Logger(BOT_TOKEN=None, CHAT_ID="-1001638761874") # IBKR stats -1001967555467
LoggerOrders = Logger(BOT_TOKEN=None, CHAT_ID="-1001986223622")

State = dict()
State[7497] = None
State[7500] = None


def connection(ib=ib, host="127.0.0.1", port=7500):
    connection_res = dict()
    connection_res = {
        "port": port,
        "state": False,
        "disconnect": ib.disconnect,
    }

    try:
        ib.connect(host, port, random.randint(0, 99))
        # Events IB
        ib.client.apiStart += Handler.event_api_start
        ib.client.apiError += Handler.event_api_rror
        ib.errorEvent += Handler.event_error

    except Exception as err:
        print("Connection exception :::", err)
        connection_res["state"] = False
        if connection_res["state"] != State[port]:
            State[port] = connection_res["state"]
            LoggerStatus.send(f"Connection lost on port : {port}")
    else:
        print("Connection successful")
        connection_res["state"] = True
        if connection_res["state"] != State[port]:
            State[port] = connection_res["state"]
            LoggerStatus.send(f"Connected to port : {port}")

    return connection_res


def compare_states(ib_main=main, ib_slave=slave):
    main_pos = ib_main.reqPositions()
    slave_pos = ib_slave.reqPositions()

    to_place_arr = []
    for m_pos in main_pos:
        to_place = dict()
        # create slave contract
        temp_contract = m_pos.contract.dict()
        temp_contract["symbol"] = "M" + temp_contract["symbol"]
        temp_contract["localSymbol"] = "M" + temp_contract["localSymbol"]

        to_place["multiplier"] = (
            temp_contract["multiplier"] if temp_contract["multiplier"] else None
        )
        to_place["position"] = m_pos.position
        to_place["avgCost"] = m_pos.avgCost
        to_place["contract"] = Contract(
            secType=temp_contract["secType"],
            exchange=temp_contract["exchange"] if temp_contract["exchange"] else "CME",
            currency=temp_contract["currency"],
            lastTradeDateOrContractMonth=temp_contract["lastTradeDateOrContractMonth"],
            symbol=temp_contract["symbol"],
            localSymbol=temp_contract["localSymbol"],
        )
        try:
            # get slave contract details
            contract_details = ib_main.reqContractDetails(to_place["contract"])
            if len(contract_details) > 0:
                to_place_arr.append(to_place)
        except Exception as err:
            print("No contract details", err)
    for el_place in to_place_arr:
        if el_place["position"] != 0:
            if len(slave_pos) == 0:
                action = "BUY" if el_place["position"] > 0 else "SELL"
                el_place["order"] = Order(
                    action=action,
                    orderType="MKT",
                    totalQuantity=abs(el_place["position"]),
                    tif="GTC",
                )
            else:
                for s_pos in slave_pos:
                    slave_contract = s_pos.contract.dict()
                    if (
                        slave_contract["symbol"] == el_place["contract"].symbol
                        and s_pos.position != el_place["position"]
                    ):
                        t_quantity = el_place["position"] - s_pos.position

                        action = (
                            "BUY" if el_place["position"] > s_pos.position else "SELL"
                        )
                        el_place["order"] = Order(
                            action=action,
                            orderType="MKT",
                            totalQuantity=abs(t_quantity),
                            tif="GTC",
                        )

            if el_place.get("order"):
                placed_order = ib_slave.placeOrder(
                    contract=el_place["contract"], order=el_place["order"]
                )
    print("COMPARE", len(main_pos), len(slave_pos))

def get_completed_orders(ib=ib):
    completeOrders = ib.trades()
    dictOrders = []
    for itemA in completeOrders:
        print("INTIAL_COMPLETED", itemA)
        item = itemA.dict()
        orderDict = item["order"].dict()
        del orderDict["softDollarTier"]
        contractDict = item["contract"].dict()
        statusDict = item["orderStatus"].dict()

        itemDict = {
            "orderId": orderDict["permId"],
            "action": orderDict["action"],
            "quantity": orderDict["filledQuantity"],
            "orderType": orderDict["orderType"],
            "symbol": contractDict["symbol"],
            "status": statusDict["status"],
        }
        if statusDict.get("status"):
            if statusDict["status"] == "Submitted":
                print("submittED")
        if orderDict["orderType"] == "MKT":
            itemDict["price"] = orderDict["trailStopPrice"]
        else:
            itemDict["price"] = orderDict["lmtPrice"]
        if item["fills"] and item["fills"][0]:
            itemDict["execId"] = item["fills"][0].execution.dict()["execId"]
        if item["log"] and item["log"][0]:
            itemDict["time"] = str(item["log"][0].dict()["time"])
        dictOrders.append(itemDict)
    return dictOrders

def get_opened_orders(ib=ib):
    openOrders = ib.reqAllOpenOrders()
    dictOrders = []
    for item in openOrders:
        orderDict = item.order.dict()
        del orderDict["softDollarTier"]
        contractDict = item.contract.dict()
        timeDict = item.log[0].dict()["time"]
        timeDict = timeDict.strftime("%Y-%m-%d %H:%M:%S %z")

        itemDict = {
            "orderId": orderDict["permId"],
            "action": orderDict["action"],
            "quantity": orderDict["totalQuantity"],
            "orderType": orderDict["orderType"],
            "price": orderDict["lmtPrice"],
            "symbol": contractDict["symbol"],
            "time": timeDict,
        }
        dictOrders.append(itemDict)

    return dictOrders

def opened_or_updated(ib=ib):
    data = get_opened_orders(ib=ib)
    for order in data:
        print(order)

        def update_msg_id(msg):
            sended_messages[order["orderId"]]["message"] = msg.message_id

        def update_msg_status(msg):
            sended_messages[order["orderId"]]["order"] = order
            sended_messages[order["orderId"]]["status"] = "Updated"

        print("GET", sended_messages, sended_messages.get(order["orderId"]))

        if not sended_messages.get(order["orderId"]):
            print("INSIDE")
            sended_messages[order["orderId"]] = {"status": "Opened", "order": order}
            print("INSIDE2", sended_messages)
            LoggerOrders.send(
                text=f"▫️ Order ID : {order['orderId'] }▫️\nSymbol : {order['symbol']}\nQuantity : {order['quantity']}\nOrder call : {order['action']} {order['orderType'] if order['orderType'] else ''} {order['price']}\nTime : {order['time']}",
                callback=update_msg_id,
            )
        else:
            if sended_messages[order["orderId"]]["order"]["price"] != order["price"]:
                print("NOT SAME")
                LoggerOrders.reply(
                    f"▫️ Order ID : {order['orderId']} ▫️ \n🔔 Order updated ! Price : {order['price']}",
                    sended_messages[order["orderId"]]["message"],
                    callback=update_msg_status,
                )

def executed_or_cancelled(ib=ib):
    data = get_completed_orders(ib=main)
    print("DATA:", data)
    for order in data:

        def update_msg_id(msg):
            sended_messages[order["orderId"]]["message"] = msg.message_id

        if (
            not sended_messages.get(order["orderId"])
            and order.get("execId")
            and order["quantity"] > 0
        ):
            sended_messages[order["orderId"]] = {"status": "Executed", "order": order}
            LoggerOrders.send(
                text=f"▫️ Order ID : {order['orderId']} ▫️\nSymbol : {order['symbol']}\nPrice : {order['price']}\nQuantity : {order['quantity']}\n Order call : {order['action']} {order['orderType']}\nTime : {order['time']}",
                callback=update_msg_id,
            )
        elif (
            sended_messages.get(order["orderId"])
            and sended_messages[order["orderId"]]["status"] != "Executed"
            and sended_messages[order["orderId"]]["status"] != "Cancelled"
        ):
            if order["status"] == "Filled":
                sended_messages[order["orderId"]]["status"] = "Executed"
                if (
                    sended_messages[order["orderId"]]["order"]["price"]
                    != order["price"]
                ):
                    sended_messages[order["orderId"]]["order"]["price"] = order["price"]
                    LoggerOrders.reply(
                        f"▫️ Order ID : {order['orderId']} ▫️ \n🔔 Updated price : {order['price']}\n✅ Executed!",
                        sended_messages[order["orderId"]]["message"],
                        callback=None,
                    )
                else:
                    if (
                        sended_messages[order["orderId"]]["order"]["price"]
                        != order["price"]
                    ):
                        sended_messages[order["orderId"]]["order"]["price"] = order[
                            "price"
                        ]
                        LoggerOrders.reply(
                            f"▫️ Order ID : {order['orderId']} ▫️\n✅Order executed!",
                            sended_messages[order["orderId"]]["message"],
                            callback=None,
                        )
            if order["status"] == "Cancelled":
                print("CANCELLED", sended_messages[order["orderId"]]["status"])
                sended_messages[order["orderId"]]["status"] = "Cancelled"
                LoggerOrders.reply(
                    f"▫️ Order ID : {order['orderId']} ▫️\n⛔️Order Cancelled",
                    sended_messages[order["orderId"]]["message"],
                    callback=None,
                )


while True:
    main_conn = connection(ib=main, port=7497)
    slave_conn = connection(ib=slave, port=7500)
    print(
        "main_connection___",
        main_conn["state"],
        "slave_connection___",
        slave_conn["state"],
    )

    if main_conn["state"]:
        opened_or_updated(ib=main)
        executed_or_cancelled(ib=main)
    if main_conn["state"] and slave_conn["state"]:
        compare_states(ib_main=main, ib_slave=slave)
    else:
        print("Not connected")

    # Writing to sample.json
    with open(os.path.abspath("./sendedMessages.txt"), "w") as outfile:
        outfile.write(str(sended_messages))

    time.sleep(2)
    main_conn["disconnect"]()
    slave_conn["disconnect"]()
    print("LOOP ENDED")
