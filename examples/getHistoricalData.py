
import json
from ib_insync import *
main = IB()
main.connect("127.0.0.1",7497,399)

# contract = Stock('TSLA', 'SMART', 'USD')

contract= Future(symbol='NQ',currency='USD',localSymbol='NQU3')


dt = ''
barsList = []
while True:
    bars = main.reqHistoricalData(
        contract,
        endDateTime=dt,
        durationStr='10 D',
        barSizeSetting='1 min',
        whatToShow='TRADES',
        useRTH=True,
        formatDate=1)
    if not bars:
        break
    barsList.append(bars)
    dt = bars[0].date
    print(dt)

main.disconnect()








